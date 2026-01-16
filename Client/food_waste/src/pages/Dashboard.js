import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUserId, currentUserName } = useUser();
    const [stats, setStats] = useState([
        { title: 'My Food Items', value: '0', icon: '🍎', color: '#10b981', path: '/food-items' },
        { title: 'My Active Alerts', value: '0', icon: '⏰', color: '#f59e0b', path: '/alerts' },
        { title: 'My Claims', value: '0', icon: '✋', color: '#3b82f6', path: '/claims' },
        { title: 'My Groups', value: '0', icon: '👥', color: '#8b5cf6', path: '/groups' },
    ]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [foodItemsData, claimsData, groupsData, allGroupMembers] = await Promise.all([
                api.getFoodItemsWithCategories(),
                api.getClaims(),
                api.request('/friendgroups'),
                api.request('/groupmembers')
            ]);

            // STEP 1: STRICT USER SCOPING

            // Food Items: ONLY owned by currentUserId
            const myFoodItems = foodItemsData.filter(item => item.userId === currentUserId);

            // Active Alerts: Compute from MY food items
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const myAlerts = myFoodItems.filter(item => {
                if (item.status === 'claimed') return false;

                const expirationDate = new Date(item.expirationDate);
                expirationDate.setHours(0, 0, 0, 0);

                const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                // Alerts for items expiring in 0-7 days
                return daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
            });

            // Claims: ONLY where I'm involved
            const myClaims = claimsData.filter(claim => {
                // Claims I made OR claims on my items
                const isMyClaim = claim.userId === currentUserId;

                // Find the food item to check ownership
                const foodItem = foodItemsData.find(item => item.id === claim.foodItemId);
                const isMyItem = foodItem && foodItem.userId === currentUserId;

                return isMyClaim || isMyItem;
            });

            // Groups: ONLY where I'm owner or member
            const membershipMap = new Map();
            allGroupMembers.forEach(member => {
                if (!membershipMap.has(member.GroupId)) {
                    membershipMap.set(member.GroupId, []);
                }
                membershipMap.get(member.GroupId).push(member.UserId);
            });

            const myGroups = groupsData.filter(group => {
                const isOwner = group.OwnerId === currentUserId;
                const groupMembers = membershipMap.get(group.GroupId) || [];
                const isMember = groupMembers.includes(currentUserId);
                return isOwner || isMember;
            });

            // Update stats with PERSONAL counts
            setStats([
                { title: 'My Food Items', value: String(myFoodItems.length), icon: '🍎', color: '#10b981', path: '/food-items' },
                { title: 'My Active Alerts', value: String(myAlerts.length), icon: '⏰', color: '#f59e0b', path: '/alerts' },
                { title: 'My Claims', value: String(myClaims.length), icon: '✋', color: '#3b82f6', path: '/claims' },
                { title: 'My Groups', value: String(myGroups.length), icon: '👥', color: '#8b5cf6', path: '/groups' },
            ]);

            // STEP 2: PERSONAL RECENT ACTIVITY
            const activities = [];

            // Add latest food items I added (max 3)
            myFoodItems
                .sort((a, b) => new Date(b.expirationDate) - new Date(a.expirationDate))
                .slice(0, 3)
                .forEach(item => {
                    activities.push({
                        type: 'food',
                        icon: '🍎',
                        text: `Added food item: ${item.name}`,
                        date: item.expirationDate,
                    });
                });

            // Add my latest alerts (max 2)
            myAlerts
                .slice(0, 2)
                .forEach(item => {
                    const expirationDate = new Date(item.expirationDate);
                    expirationDate.setHours(0, 0, 0, 0);
                    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                    activities.push({
                        type: 'alert',
                        icon: '⏰',
                        text: `Alert: ${item.name} expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`,
                        date: item.expirationDate,
                    });
                });

            // Add my latest claims (max 2)
            myClaims
                .sort((a, b) => new Date(b.claimDate) - new Date(a.claimDate))
                .slice(0, 2)
                .forEach(claim => {
                    const foodItem = foodItemsData.find(item => item.id === claim.foodItemId);
                    const itemName = foodItem ? foodItem.name : `Item ${claim.foodItemId}`;

                    const isMyClaim = claim.userId === currentUserId;
                    const text = isMyClaim
                        ? `Claimed: ${itemName}`
                        : `Received claim on: ${itemName}`;

                    activities.push({
                        type: 'claim',
                        icon: '✋',
                        text,
                        date: claim.claimDate,
                    });
                });

            // Sort all activities by date and take top 5
            const sortedActivities = activities
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            setRecentActivity(sortedActivities);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [currentUserId]); // Re-fetch when user changes

    if (loading) return <Loading message="Loading your dashboard..." />;
    if (error) return <ErrorMessage message={error} onRetry={fetchDashboardData} />;

    return (
        <div className="page-container">
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1>My Dashboard</h1>
                    <p className="dashboard-subtitle">Welcome back, {currentUserName}!</p>
                </div>

                <div className="dashboard-stats">
                    {stats.map((stat, index) => (
                        <Card
                            key={index}
                            className="stat-card"
                            hover
                            onClick={() => navigate(stat.path)}
                        >
                            <div className="stat-icon" style={{ color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-value">{stat.value}</h3>
                                <p className="stat-title">{stat.title}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="dashboard-grid">
                    <Card className="dashboard-card">
                        <h2 className="card-title">My Recent Activity</h2>
                        {recentActivity.length === 0 ? (
                            <p className="card-empty">No recent activity. Start by adding food items!</p>
                        ) : (
                            <div className="activity-list">
                                {recentActivity.map((activity, index) => (
                                    <div key={index} className="activity-item">
                                        <span className="activity-icon">{activity.icon}</span>
                                        <div className="activity-content">
                                            <p className="activity-text">{activity.text}</p>
                                            <span className="activity-date">
                                                {new Date(activity.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="dashboard-card">
                        <h2 className="card-title">Quick Actions</h2>
                        <div className="quick-actions">
                            <button className="action-btn" onClick={() => navigate('/food-items')}>
                                🍎 Add Food Item
                            </button>
                            <button className="action-btn" onClick={() => navigate('/alerts')}>
                                ⏰ View My Alerts
                            </button>
                            <button className="action-btn" onClick={() => navigate('/explore')}>
                                🔍 Explore Food
                            </button>
                            <button className="action-btn" onClick={() => navigate('/groups')}>
                                👥 My Groups
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
