import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import './Claims.css';

const Claims = () => {
    const { currentUserId } = useUser();
    const [myClaims, setMyClaims] = useState([]);
    const [claimsOnMyItems, setClaimsOnMyItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const [activeTab, setActiveTab] = useState('my-claims');
    const [processingClaims, setProcessingClaims] = useState(new Set());

    const getReadableStatus = (status) => {
        const statusMap = {
            'pending': 'Pending pickup',
            'accepted': 'Accepted',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    };

    const fetchClaims = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch claims, food items, and users in parallel
            const [claimsData, foodItemsData, usersData] = await Promise.all([
                api.getClaims(),
                api.getFoodItemsWithCategories(),
                api.request('/users')
            ]);

            // Build lookup maps
            const foodItemMap = new Map();
            const foodItemOwnerMap = new Map();
            foodItemsData.forEach(item => {
                foodItemMap.set(item.id, item.name);
                foodItemOwnerMap.set(item.id, item.userId);
            });

            const userMap = new Map();
            usersData.forEach(user => {
                userMap.set(user.UserId, user.UserName);
            });

            // Enrich claims with real names
            const enrichedClaims = claimsData.map(claim => ({
                ...claim,
                itemName: foodItemMap.get(claim.foodItemId) || `Item ${claim.foodItemId}`,
                userName: userMap.get(claim.userId) || `User ${claim.userId}`,
                itemOwnerId: foodItemOwnerMap.get(claim.foodItemId),
                readableStatus: getReadableStatus(claim.status)
            }));

            // Split claims into two categories
            const myClaimsList = enrichedClaims.filter(claim => claim.userId === currentUserId);
            const claimsOnMyItemsList = enrichedClaims.filter(claim => claim.itemOwnerId === currentUserId);

            setMyClaims(myClaimsList);
            setClaimsOnMyItems(claimsOnMyItemsList);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableItems = async () => {
        try {
            // Fetch availability and food items in parallel
            const [availabilityData, foodItemsData] = await Promise.all([
                api.getAvailability(),
                api.getFoodItemsWithCategories()
            ]);

            // Build set of food item IDs that are marked as available (source of truth)
            const availabilityFoodItemIds = new Set(
                availabilityData.map(a => a.FoodItemId)
            );

            // Filter food items to only those in the Availability table
            const claimableItems = foodItemsData.filter(item =>
                availabilityFoodItemIds.has(item.id)
            );

            setAvailableItems(claimableItems);
        } catch (err) {
            console.error('Failed to fetch available items:', err);
            setAvailableItems([]);
        }
    };

    const handleMakeClaim = async () => {
        await fetchAvailableItems();
        setIsClaimModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsClaimModalOpen(false);
        setSelectedItemId('');
    };

    const handleSubmitClaim = async (e) => {
        e.preventDefault();

        if (!selectedItemId) {
            alert('Please select an item to claim');
            return;
        }

        setIsClaiming(true);
        try {
            // Use the claimFoodItem helper which creates claim + updates status
            await api.claimFoodItem(parseInt(selectedItemId), currentUserId);

            // Refresh claims list
            await fetchClaims();

            alert('Claim created successfully!');
            handleCloseModal();
        } catch (err) {
            alert(`Failed to create claim: ${err.message}`);
        } finally {
            setIsClaiming(false);
        }
    };

    const handleAcceptClaim = async (claim) => {
        if (!window.confirm(`Accept claim from ${claim.userName} for "${claim.itemName}"?`)) {
            return;
        }

        setProcessingClaims(prev => new Set(prev).add(claim.id));

        try {
            // Step 1: Get the full food item details
            const foodItemsData = await api.getFoodItemsWithCategories();
            const originalFoodItem = foodItemsData.find(item => item.id === claim.foodItemId);

            if (!originalFoodItem) {
                throw new Error('Food item not found');
            }

            // Step 2: Create a NEW food item for the claimer (transfer ownership)
            // This adds the item to the claimer's fridge
            const newFoodItemData = {
                name: originalFoodItem.name,
                quantity: originalFoodItem.quantity,
                expirationDate: originalFoodItem.expirationDate,
                categoryId: originalFoodItem.categoryId,
                userId: claim.userId, // IMPORTANT: Set to claimer's ID
                status: 'normal' // Reset to normal status
            };

            await api.createFoodItem(newFoodItemData);
            console.log(`[Claim Transfer] Created new food item for user ${claim.userId}`);

            // Step 3: Delete the original food item from the owner's fridge
            await api.deleteFoodItem(claim.foodItemId);
            console.log(`[Claim Transfer] Deleted original food item ${claim.foodItemId} from owner`);

            // Step 4: Update claim status to accepted
            await api.updateClaim(claim.id, { status: 'accepted' });

            // Refresh claims
            await fetchClaims();

            alert(`Claim accepted! "${claim.itemName}" has been transferred to ${claim.userName}'s fridge.`);
        } catch (err) {
            alert(`Failed to accept claim: ${err.message}`);
            console.error('[Claim Transfer] Error:', err);
        } finally {
            setProcessingClaims(prev => {
                const newSet = new Set(prev);
                newSet.delete(claim.id);
                return newSet;
            });
        }
    };

    const handleDeclineClaim = async (claim) => {
        if (!window.confirm(`Decline claim from ${claim.userName} for "${claim.itemName}"?`)) {
            return;
        }

        setProcessingClaims(prev => new Set(prev).add(claim.id));

        try {
            // Update claim status to rejected
            await api.updateClaim(claim.id, { status: 'rejected' });

            // Keep food item as disponibil (no change needed)

            // Refresh claims
            await fetchClaims();

            alert('Claim declined.');
        } catch (err) {
            alert(`Failed to decline claim: ${err.message}`);
        } finally {
            setProcessingClaims(prev => {
                const newSet = new Set(prev);
                newSet.delete(claim.id);
                return newSet;
            });
        }
    };

    const isClaimProcessing = (claimId) => {
        return processingClaims.has(claimId);
    };

    useEffect(() => {
        fetchClaims();
    }, [currentUserId]);

    if (loading) return <Loading message="Loading claims..." />;
    if (error) return <ErrorMessage message={error} onRetry={fetchClaims} />;

    const renderClaimCard = (claim, index, isOwner = false) => (
        <Card key={claim.id ?? index} className="claim-card" hover>
            <div className="claim-header">
                <h3>{claim.itemName}</h3>
                <span className={`claim-status claim-status-${claim.status}`}>
                    {claim.readableStatus}
                </span>
            </div>
            <div className="claim-details">
                <p><strong>Claimed by:</strong> {claim.userName}</p>
                <p><strong>Date:</strong> {new Date(claim.claimDate).toLocaleDateString()}</p>
                {claim.pickupLocation && (
                    <p><strong>Pickup:</strong> {claim.pickupLocation}</p>
                )}
            </div>
            {isOwner && claim.status === 'pending' && (
                <div className="claim-actions">
                    <button
                        className="btn-success"
                        onClick={() => handleAcceptClaim(claim)}
                        disabled={isClaimProcessing(claim.id)}
                    >
                        {isClaimProcessing(claim.id) ? 'Processing...' : '✓ Accept'}
                    </button>
                    <button
                        className="btn-danger"
                        onClick={() => handleDeclineClaim(claim)}
                        disabled={isClaimProcessing(claim.id)}
                    >
                        {isClaimProcessing(claim.id) ? 'Processing...' : '✗ Decline'}
                    </button>
                </div>
            )}
        </Card>
    );

    return (
        <div className="claims">
            <div className="page-header">
                <h1>My Claims</h1>
                <button className="btn-primary" onClick={handleMakeClaim}>Make a Claim</button>
            </div>

            {/* Tabs */}
            <div className="claims-tabs">
                <button
                    className={`tab-button ${activeTab === 'my-claims' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('my-claims')}
                >
                    Claims I Made ({myClaims.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'received-claims' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('received-claims')}
                >
                    Claims on My Items ({claimsOnMyItems.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'my-claims' && (
                <div className="tab-content">
                    {myClaims.length === 0 ? (
                        <Card>
                            <p className="empty-state">You haven't claimed any items yet. Browse available food to make a claim!</p>
                        </Card>
                    ) : (
                        <div className="claims-grid">
                            {myClaims.map((claim, index) => renderClaimCard(claim, index, false))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'received-claims' && (
                <div className="tab-content">
                    {claimsOnMyItems.length === 0 ? (
                        <Card>
                            <p className="empty-state">No one has claimed your items yet. Mark items as available to share them!</p>
                        </Card>
                    ) : (
                        <div className="claims-grid">
                            {claimsOnMyItems.map((claim, index) => renderClaimCard(claim, index, true))}
                        </div>
                    )}
                </div>
            )}

            {/* Make a Claim Modal */}
            {isClaimModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content claim-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Make a Claim</h2>
                            <button className="modal-close" onClick={handleCloseModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmitClaim}>
                            <div className="modal-body">
                                {availableItems.length === 0 ? (
                                    <p className="empty-state">No available items to claim at the moment.</p>
                                ) : (
                                    <div className="form-group">
                                        <label>Select Food Item *</label>
                                        <select
                                            value={selectedItemId}
                                            onChange={(e) => setSelectedItemId(e.target.value)}
                                            required
                                        >
                                            <option value="">Choose an item...</option>
                                            {availableItems.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name} - Expires: {new Date(item.expirationDate).toLocaleDateString()}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="form-help">
                                            Only items marked as "available" can be claimed.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isClaiming}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isClaiming || availableItems.length === 0}
                                >
                                    {isClaiming ? 'Claiming...' : 'Claim Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Claims;
