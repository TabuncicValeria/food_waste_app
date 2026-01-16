import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import './FriendGroups.css';

const FriendGroups = () => {
    const { currentUserId } = useUser();
    const [myGroups, setMyGroups] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [exploreGroups, setExploreGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [groupFoodItems, setGroupFoodItems] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        description: ''
    });
    const [allUsers, setAllUsers] = useState([]);
    const [selectedInvites, setSelectedInvites] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [processingInvitations, setProcessingInvitations] = useState(new Set());

    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch groups, group members, and users in parallel
            const [groupsData, allGroupMembers, usersData] = await Promise.all([
                api.request('/friendgroups'),
                api.request('/groupmembers'),
                api.request('/users')
            ]);

            // Build user map
            const userMap = new Map();
            usersData.forEach(user => {
                userMap.set(user.UserId, user.UserName);
            });

            // CLIENT-SIDE INVITATION TRACKING
            // Backend doesn't save/return Status or Role fields
            // Use localStorage to track invitations and acceptances

            // Get client-side invitation data
            const invitationsData = JSON.parse(localStorage.getItem('groupInvitations') || '{}');
            const acceptedMemberships = JSON.parse(localStorage.getItem('groupAcceptedMemberships') || '{}');
            const declinedInvitations = JSON.parse(localStorage.getItem('groupDeclinedInvitations') || '{}');

            // Build membership map
            const membershipMap = new Map();

            allGroupMembers.forEach(member => {
                if (!membershipMap.has(member.GroupId)) {
                    membershipMap.set(member.GroupId, new Map());
                }

                const groupId = member.GroupId;
                const userId = member.UserId;
                const invitationKey = `${groupId}_${userId}`;

                // Determine status from client-side tracking
                let status;
                let role = 'member';

                if (declinedInvitations[invitationKey]) {
                    // User declined this invitation
                    status = 'declined';
                    role = 'invited';
                } else if (invitationsData[invitationKey]) {
                    // User has a pending invitation
                    status = 'invited';
                    role = 'invited';
                } else if (acceptedMemberships[invitationKey]) {
                    // User accepted invitation
                    status = 'accepted';
                    role = 'member';
                } else {
                    // Legacy member (existed before invitation system)
                    status = 'accepted';
                    role = 'member';
                }

                membershipMap.get(groupId).set(userId, {
                    status,
                    role,
                    memberId: member.GroupMemberId || member.MemberId
                });
            });

            const my = [];
            const invited = [];
            const explore = [];

            groupsData.forEach(group => {
                const groupMembership = membershipMap.get(group.GroupId) || new Map();
                const isOwner = group.OwnerId === currentUserId;

                // Get user's membership for THIS group
                const userMembership = groupMembership.get(currentUserId);

                // Count accepted members (including legacy members without Status)
                const acceptedMemberIds = Array.from(groupMembership.entries())
                    .filter(([userId, membership]) => membership.status === 'accepted')
                    .map(([userId]) => userId);

                // Owner is always a member
                const allMemberIds = new Set([group.OwnerId, ...acceptedMemberIds]);
                const memberCount = allMemberIds.size;

                const groupData = {
                    ...group,
                    id: group.GroupId,
                    name: group.GroupName,
                    description: group.Description,
                    ownerId: group.OwnerId,
                    ownerName: userMap.get(group.OwnerId) || `User ${group.OwnerId}`,
                    memberCount,
                    isOwner
                };

                // THREE-SECTION FILTERING LOGIC
                if (isOwner) {
                    // Owner's group - always in My Groups
                    my.push(groupData);
                } else if (userMembership) {
                    // User has a membership record
                    if (userMembership.status === 'invited') {
                        // Pending invitation - goes to Invitations
                        invited.push({
                            ...groupData,
                            memberId: userMembership.memberId
                        });
                    } else if (userMembership.status === 'accepted') {
                        // Accepted member (or legacy member) - goes to My Groups
                        my.push({
                            ...groupData,
                            isMember: true
                        });
                    } else if (userMembership.status === 'declined') {
                        // Declined - can explore
                        explore.push(groupData);
                    }
                } else {
                    // No membership record - can explore
                    explore.push(groupData);
                }
            });

            setMyGroups(my);
            setInvitations(invited);
            setExploreGroups(explore);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupDetails = async (group, isMember) => {
        try {
            setMembersLoading(true);
            setSelectedGroup({ ...group, isMember });

            if (!isMember) {
                setGroupMembers([]);
                setGroupFoodItems([]);
                setMembersLoading(false);
                return;
            }

            const [allMembers, usersData, foodItemsData] = await Promise.all([
                api.request('/groupmembers'),
                api.request('/users'),
                api.getFoodItemsWithCategories()
            ]);

            const groupMembersData = allMembers.filter(m => m.GroupId === group.id);

            const userMap = new Map();
            usersData.forEach(user => {
                userMap.set(user.UserId, {
                    name: user.UserName,
                    foodTag: user.FoodTag || 'No preference'
                });
            });

            // Get STRICTLY accepted member user IDs only
            const memberUserIds = groupMembersData
                .filter(m => m.Status === 'accepted')
                .map(m => m.UserId);

            if (!memberUserIds.includes(group.ownerId)) {
                memberUserIds.push(group.ownerId);
            }

            const enrichedMembers = memberUserIds.map(userId => ({
                userId,
                userName: userMap.get(userId)?.name || `User ${userId}`,
                foodTag: userMap.get(userId)?.foodTag || 'No preference',
                isOwner: userId === group.ownerId
            }));

            const groupFood = foodItemsData.filter(item =>
                item.status === 'disponibil' && memberUserIds.includes(item.userId)
            );

            setGroupMembers(enrichedMembers);
            setGroupFoodItems(groupFood);
        } catch (err) {
            alert(`Failed to load group details: ${err.message}`);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleViewGroup = (group, isMember) => {
        fetchGroupDetails(group, isMember);
    };

    const handleCloseModal = () => {
        setSelectedGroup(null);
        setGroupMembers([]);
        setGroupFoodItems([]);
    };

    const handleCreateGroup = async () => {
        setIsCreateModalOpen(true);
        // Fetch users for invitation
        try {
            const users = await api.request('/users');
            setAllUsers(users.filter(u => u.UserId !== currentUserId));
        } catch (err) {
            alert(`Failed to load users: ${err.message}`);
        }
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreateFormData({ name: '', description: '' });
        setSelectedInvites([]);
    };

    const toggleInvite = (userId) => {
        setSelectedInvites(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmitCreate = async (e) => {
        e.preventDefault();

        if (!createFormData.name.trim()) {
            alert('Group name is required');
            return;
        }

        setIsCreating(true);
        try {
            // Create group
            const newGroup = await api.createFriendGroup({
                groupName: createFormData.name,
                ownerId: currentUserId,
                description: createFormData.description || ''
            });

            const groupId = newGroup.GroupId || newGroup.groupId || newGroup.id;

            // Create invitations for selected users
            const invitationsData = JSON.parse(localStorage.getItem('groupInvitations') || '{}');

            for (const userId of selectedInvites) {
                await api.request('/groupmembers', {
                    method: 'POST',
                    body: JSON.stringify({
                        GroupId: groupId,
                        UserId: userId,
                        Role: 'invited',
                        Status: 'invited'
                    })
                });

                // Store invitation in localStorage (backend doesn't save Status/Role)
                const invitationKey = `${groupId}_${userId}`;
                invitationsData[invitationKey] = {
                    groupId,
                    userId,
                    invitedAt: new Date().toISOString(),
                    invitedBy: currentUserId
                };
            }

            // Save updated invitations
            localStorage.setItem('groupInvitations', JSON.stringify(invitationsData));

            await fetchGroups();
            alert(`Group created successfully! ${selectedInvites.length} invitation(s) sent.`);
            handleCloseCreateModal();
        } catch (err) {
            alert(`Failed to create group: ${err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAcceptInvitation = async (group) => {
        if (!window.confirm(`Join "${group.name}"?`)) {
            return;
        }

        setProcessingInvitations(prev => new Set(prev).add(group.id));

        try {
            // Update membership status to accepted
            await api.request(`/groupmembers/${group.memberId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    Status: 'accepted',
                    Role: 'member'
                })
            });

            // Update localStorage: remove from invitations, add to accepted
            const invitationKey = `${group.id}_${currentUserId}`;
            const invitationsData = JSON.parse(localStorage.getItem('groupInvitations') || '{}');
            const acceptedMemberships = JSON.parse(localStorage.getItem('groupAcceptedMemberships') || '{}');

            delete invitationsData[invitationKey];
            acceptedMemberships[invitationKey] = {
                groupId: group.id,
                userId: currentUserId,
                acceptedAt: new Date().toISOString()
            };

            localStorage.setItem('groupInvitations', JSON.stringify(invitationsData));
            localStorage.setItem('groupAcceptedMemberships', JSON.stringify(acceptedMemberships));

            await fetchGroups();
            alert('Invitation accepted! You are now a member.');
        } catch (err) {
            alert(`Failed to accept invitation: ${err.message}`);
        } finally {
            setProcessingInvitations(prev => {
                const newSet = new Set(prev);
                newSet.delete(group.id);
                return newSet;
            });
        }
    };

    const handleDeclineInvitation = async (group) => {
        if (!window.confirm(`Decline invitation to "${group.name}"?`)) {
            return;
        }

        setProcessingInvitations(prev => new Set(prev).add(group.id));

        try {
            // Update membership status to declined
            await api.request(`/groupmembers/${group.memberId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    Status: 'declined'
                })
            });

            // Update localStorage: remove from invitations, add to declined
            const invitationKey = `${group.id}_${currentUserId}`;
            const invitationsData = JSON.parse(localStorage.getItem('groupInvitations') || '{}');
            const declinedInvitations = JSON.parse(localStorage.getItem('groupDeclinedInvitations') || '{}');

            delete invitationsData[invitationKey];
            declinedInvitations[invitationKey] = {
                groupId: group.id,
                userId: currentUserId,
                declinedAt: new Date().toISOString()
            };

            localStorage.setItem('groupInvitations', JSON.stringify(invitationsData));
            localStorage.setItem('groupDeclinedInvitations', JSON.stringify(declinedInvitations));

            await fetchGroups();
            alert('Invitation declined.');
        } catch (err) {
            alert(`Failed to decline invitation: ${err.message}`);
        } finally {
            setProcessingInvitations(prev => {
                const newSet = new Set(prev);
                newSet.delete(group.id);
                return newSet;
            });
        }
    };

    const handleJoinGroup = async (group) => {
        if (!window.confirm(`Join "${group.name}"?`)) {
            return;
        }

        setProcessingInvitations(prev => new Set(prev).add(group.id));

        try {
            await api.request('/groupmembers', {
                method: 'POST',
                body: JSON.stringify({
                    GroupId: group.id,
                    UserId: currentUserId,
                    Status: 'accepted',
                    Role: 'member'
                })
            });

            await fetchGroups();
            alert('Successfully joined group!');
        } catch (err) {
            alert(`Failed to join group: ${err.message}`);
        } finally {
            setProcessingInvitations(prev => {
                const newSet = new Set(prev);
                newSet.delete(group.id);
                return newSet;
            });
        }
    };

    const isProcessing = (groupId) => {
        return processingInvitations.has(groupId);
    };

    useEffect(() => {
        fetchGroups();
    }, [currentUserId]);

    if (loading) return <Loading message="Loading groups..." />;
    if (error) return <ErrorMessage message={error} onRetry={fetchGroups} />;

    return (
        <div className="page-container">
            <div className="friend-groups">
                <div className="page-header">
                    <h1>Friend Groups</h1>
                    <button className="btn-primary" onClick={handleCreateGroup}>
                        Create Group
                    </button>
                </div>

                {/* My Groups Section */}
                <section className="groups-section">
                    <h2>✅ My Groups</h2>
                    {myGroups.length === 0 ? (
                        <Card>
                            <p className="empty-state">
                                You haven't joined any groups yet. Create a group or check your invitations!
                            </p>
                        </Card>
                    ) : (
                        <div className="groups-grid">
                            {myGroups.map((group, index) => (
                                <Card key={group.id ?? index} className="group-card" hover>
                                    <div className="group-header">
                                        <h3>{group.name}</h3>
                                        <span className={`group-badge ${group.isOwner ? 'badge-owner' : 'badge-member'}`}>
                                            {group.isOwner ? '👑 Owner' : '👤 Member'}
                                        </span>
                                    </div>
                                    <p className="group-description">{group.description || 'No description'}</p>
                                    <div className="group-meta">
                                        <span>👥 {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="group-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={() => handleViewGroup(group, true)}
                                        >
                                            View Group
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Group Invitations Section */}
                <section className="groups-section">
                    <h2>📩 Group Invitations</h2>
                    {invitations.length === 0 ? (
                        <Card>
                            <p className="empty-state">
                                No pending invitations.
                            </p>
                        </Card>
                    ) : (
                        <div className="groups-grid">
                            {invitations.map((group, index) => (
                                <Card key={group.id ?? index} className="group-card invitation-card" hover>
                                    <div className="group-header">
                                        <h3>{group.name}</h3>
                                        <span className="group-badge badge-invitation">
                                            📩 Invitation Pending
                                        </span>
                                    </div>
                                    <p className="group-description">{group.description || 'No description'}</p>
                                    <p className="invitation-from">Invited by: <strong>{group.ownerName}</strong></p>
                                    <div className="group-meta">
                                        <span>👥 {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="group-actions">
                                        <button
                                            className="btn-success"
                                            onClick={() => handleAcceptInvitation(group)}
                                            disabled={isProcessing(group.id)}
                                        >
                                            {isProcessing(group.id) ? 'Processing...' : '✓ Accept'}
                                        </button>
                                        <button
                                            className="btn-danger"
                                            onClick={() => handleDeclineInvitation(group)}
                                            disabled={isProcessing(group.id)}
                                        >
                                            {isProcessing(group.id) ? 'Processing...' : '✗ Decline'}
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Explore Groups Section */}
                <section className="groups-section">
                    <h2>🌍 Explore Groups</h2>
                    {exploreGroups.length === 0 ? (
                        <Card>
                            <p className="empty-state">
                                No groups available to join at the moment.
                            </p>
                        </Card>
                    ) : (
                        <div className="groups-grid">
                            {exploreGroups.map((group, index) => (
                                <Card key={group.id ?? index} className="group-card" hover>
                                    <div className="group-header">
                                        <h3>{group.name}</h3>
                                    </div>
                                    <p className="group-description">{group.description || 'No description'}</p>
                                    <div className="group-meta">
                                        <span>👥 {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="group-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={() => handleViewGroup(group, false)}
                                        >
                                            View Info
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleJoinGroup(group)}
                                            disabled={isProcessing(group.id)}
                                        >
                                            {isProcessing(group.id) ? 'Joining...' : 'Join Group'}
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* View Group Modal */}
                {selectedGroup && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content group-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedGroup.name}</h2>
                                <button className="modal-close" onClick={handleCloseModal}>×</button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Description:</strong> {selectedGroup.description || 'No description'}</p>
                                <p><strong>Members:</strong> {selectedGroup.memberCount}</p>

                                {selectedGroup.isMember ? (
                                    <>
                                        {membersLoading ? (
                                            <Loading message="Loading members..." />
                                        ) : (
                                            <>
                                                <h3>Group Members</h3>
                                                <div className="members-list">
                                                    {groupMembers.map((member, idx) => (
                                                        <div key={idx} className="member-item">
                                                            <span className="member-name">
                                                                {member.userName}
                                                                {member.isOwner && ' 👑'}
                                                            </span>
                                                            <span className="member-tag">{member.foodTag}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <h3>Available Food in Group</h3>
                                                {groupFoodItems.length === 0 ? (
                                                    <p className="empty-state">No available food items in this group yet.</p>
                                                ) : (
                                                    <div className="group-food-list">
                                                        {groupFoodItems.map((item, idx) => (
                                                            <div key={idx} className="food-item-small">
                                                                <strong>{item.name}</strong> - {item.category}
                                                                <br />
                                                                <small>Expires: {new Date(item.expirationDate).toLocaleDateString()}</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="not-member-message">
                                        <p>🔒 Join this group to see members and shared food items.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Group Modal */}
                {isCreateModalOpen && (
                    <div className="modal-overlay" onClick={handleCloseCreateModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Create Group</h2>
                                <button className="modal-close" onClick={handleCloseCreateModal}>×</button>
                            </div>
                            <form onSubmit={handleSubmitCreate}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Group Name *</label>
                                        <input
                                            type="text"
                                            value={createFormData.name}
                                            onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                            required
                                            placeholder="e.g., Vegetarian Friends"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={createFormData.description}
                                            onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                                            placeholder="Describe your group..."
                                            rows="3"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Invite Friends</label>
                                        <div className="invite-list">
                                            {allUsers.length === 0 ? (
                                                <p className="empty-state">No users available to invite</p>
                                            ) : (
                                                allUsers.map(user => (
                                                    <label key={user.UserId} className="invite-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedInvites.includes(user.UserId)}
                                                            onChange={() => toggleInvite(user.UserId)}
                                                        />
                                                        <span>{user.UserName}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        {selectedInvites.length > 0 && (
                                            <p className="invite-count">{selectedInvites.length} user(s) selected</p>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={handleCloseCreateModal} disabled={isCreating}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isCreating}>
                                        {isCreating ? 'Creating...' : 'Create Group'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendGroups;
