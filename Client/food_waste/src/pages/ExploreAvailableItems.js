import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import './ExploreAvailableItems.css';

const ExploreAvailableItems = () => {
    const { isAuthenticated, currentUserId } = useUser();
    const [availableItems, setAvailableItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [claimingItems, setClaimingItems] = useState(new Set());

    const fetchAvailableItems = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch food items and users in parallel
            const [foodItemsData, usersData] = await Promise.all([
                api.getFoodItemsWithCategories(),
                api.request('/users')
            ]);

            // Build user map for owner names
            const userMap = new Map();
            usersData.forEach(user => {
                userMap.set(user.UserId, user.UserName);
            });

            // Filter for disponibil items, exclude own items if logged in
            const available = foodItemsData
                .filter(item => {
                    if (item.status !== 'disponibil') return false;
                    // Exclude own items if authenticated
                    if (isAuthenticated && item.userId === currentUserId) return false;
                    return true;
                })
                .map(item => ({
                    ...item,
                    ownerName: userMap.get(item.userId) || `User ${item.userId}`
                }));

            setAvailableItems(available);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailableItems();
    }, [isAuthenticated, currentUserId]);

    const handleClaim = async (item) => {
        if (!isAuthenticated) {
            alert('Please login to claim items');
            return;
        }

        if (!window.confirm(`Claim "${item.name}"? This will reserve it for you.`)) {
            return;
        }

        setClaimingItems(prev => new Set(prev).add(item.id));

        try {
            // Create claim and update item status
            await api.claimFoodItem(item.id, currentUserId);

            // Optimistic UI update - remove from list
            setAvailableItems(prev => prev.filter(i => i.id !== item.id));

            alert('Item claimed successfully! Check "My Claims" to see your claims.');
        } catch (err) {
            alert(`Failed to claim item: ${err.message}`);
        } finally {
            setClaimingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        }
    };

    const isItemClaiming = (itemId) => {
        return claimingItems.has(itemId);
    };

    if (loading) return <Loading message="Loading available items..." />;
    if (error) return <ErrorMessage message={error} onRetry={fetchAvailableItems} />;

    return (
        <div className="explore-available-items">
            <div className="page-header">
                <h1>Explore Available Food</h1>
                <button className="btn-primary" onClick={fetchAvailableItems}>
                    Refresh
                </button>
            </div>

            {!isAuthenticated && (
                <Card className="info-banner">
                    <p>🔑 <strong>Login required to claim items.</strong> Browse available food or login to reserve items.</p>
                </Card>
            )}

            {availableItems.length === 0 ? (
                <Card>
                    <p className="empty-state">
                        {isAuthenticated
                            ? "No available items from other users at the moment. Check back later!"
                            : "No available items at the moment. Check back later!"}
                    </p>
                </Card>
            ) : (
                <div className="items-grid">
                    {availableItems.map((item, index) => (
                        <Card key={item.id ?? index} className="explore-item-card" hover>
                            <div className="item-header">
                                <h3>{item.name}</h3>
                                <span className="item-category">{item.category}</span>
                            </div>
                            <div className="item-details">
                                <p><strong>Owner:</strong> {item.ownerName}</p>
                                <p><strong>Quantity:</strong> {item.quantity}</p>
                                <p><strong>Expires:</strong> {new Date(item.expirationDate).toLocaleDateString()}</p>
                            </div>
                            <div className="item-actions">
                                <button
                                    className="btn-claim"
                                    onClick={() => handleClaim(item)}
                                    disabled={!isAuthenticated || isItemClaiming(item.id)}
                                    title={!isAuthenticated ? "Login required to claim" : "Claim this item"}
                                >
                                    {isItemClaiming(item.id)
                                        ? '⏳ Claiming...'
                                        : !isAuthenticated
                                            ? '🔒 Login to Claim'
                                            : '🎁 Claim Item'}
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExploreAvailableItems;
