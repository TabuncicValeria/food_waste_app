import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import { syncExpirationAlerts } from '../services/alertSync';
import './ExpirationAlerts.css';

const ExpirationAlerts = () => {
    const { currentUserId } = useUser();
    const [alerts, setAlerts] = useState([]);
    const [availableItems, setAvailableItems] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [operationLoading, setOperationLoading] = useState(new Set());

    // Use ref to prevent concurrent fetches
    const isFetchingRef = React.useRef(false);
    const isMountedRef = React.useRef(true);

    const fetchAlerts = async () => {
        // Prevent concurrent fetches
        if (isFetchingRef.current) {
            console.log('Fetch already in progress, skipping...');
            return;
        }

        try {
            isFetchingRef.current = true;
            setLoading(true);
            setError(null);

            // Fetch food items and availability in parallel
            // We derive alerts from food items (source of truth for expiration dates)
            const [foodItemsData, availabilityData] = await Promise.all([
                api.getFoodItemsWithCategories(),
                api.getAvailability()
            ]);

            // Only update state if component is still mounted
            if (!isMountedRef.current) return;

            // Compute alerts from food items
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Log all food items for debugging
            console.log('[ExpirationAlerts] All food items:', foodItemsData.map(item => ({
                id: item.id,
                name: item.name,
                userId: item.userId,
                status: item.status,
                expirationDate: item.expirationDate,
                daysUntil: Math.ceil((new Date(item.expirationDate).setHours(0, 0, 0, 0) - today) / (1000 * 60 * 60 * 24))
            })));

            const computedAlerts = foodItemsData
                .filter(item => {
                    // Only show alerts for current user's items
                    if (item.userId !== currentUserId) {
                        console.log(`[Filter] Skipping ${item.name} - different user (${item.userId} vs ${currentUserId})`);
                        return false;
                    }

                    const expirationDate = new Date(item.expirationDate);
                    expirationDate.setHours(0, 0, 0, 0);

                    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                    // Show alerts for ALL items expiring in 0-7 days, regardless of status
                    // This includes items that are 'claimed', 'disponibil', or 'normal'
                    const shouldShow = daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
                    if (!shouldShow) {
                        console.log(`[Filter] Skipping ${item.name} - expires in ${daysUntilExpiration} days (outside 0-7 range)`);
                    } else {
                        console.log(`[Filter] ✓ Including ${item.name} - expires in ${daysUntilExpiration} days, status: ${item.status}`);
                    }
                    return shouldShow;
                })
                .map(item => {
                    const expirationDate = new Date(item.expirationDate);
                    expirationDate.setHours(0, 0, 0, 0);

                    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                    return {
                        id: `alert-${item.id}`, // Unique alert ID based on food item ID
                        foodItemId: item.id,
                        itemName: item.name,
                        expirationDate: item.expirationDate,
                        daysUntilExpiration: daysUntilExpiration,
                        message: `This item will expire in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`,
                        status: 'active'
                    };
                })
                .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration); // Sort by urgency

            // Deduplicate alerts by item name - keep only the one expiring soonest
            const deduplicatedAlerts = [];
            const seenNames = new Set();

            for (const alert of computedAlerts) {
                const nameLower = alert.itemName.toLowerCase().trim();
                if (!seenNames.has(nameLower)) {
                    seenNames.add(nameLower);
                    deduplicatedAlerts.push(alert);
                    console.log(`[Dedup] ✓ Keeping ${alert.itemName} - expires in ${alert.daysUntilExpiration} days`);
                } else {
                    console.log(`[Dedup] ✗ Skipping duplicate ${alert.itemName} - already have an alert for this item`);
                }
            }

            console.log(`[ExpirationAlerts] Computed ${computedAlerts.length} alerts, deduplicated to ${deduplicatedAlerts.length}`);
            console.log('[ExpirationAlerts] Final alerts:', deduplicatedAlerts);

            setAlerts(deduplicatedAlerts);

            // Build set of food item IDs that are already marked as available
            const availableSet = new Set(
                availabilityData.map(av => av.FoodItemId)
            );
            setAvailableItems(availableSet);

            // Sync alerts in background (creates backend records for tracking)
            syncExpirationAlerts().catch(err => {
                console.error('Alert sync failed:', err);
            });
        } catch (err) {
            if (isMountedRef.current) {
                setError(err.message);
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        fetchAlerts();

        // Refresh alerts when user returns to this page/tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchAlerts();
            }
        };

        const handleFocus = () => {
            fetchAlerts();
        };

        // Listen for page visibility changes (tab switching)
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for window focus (navigating back from another page)
        window.addEventListener('focus', handleFocus);

        return () => {
            isMountedRef.current = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleMarkAsAvailable = async (alert) => {
        const foodItemId = alert.foodItemId;

        // Add to loading set
        setOperationLoading(prev => new Set(prev).add(foodItemId));

        try {
            await api.markFoodItemAsAvailable(foodItemId);

            // Instantly update UI - add to available items
            setAvailableItems(prev => new Set(prev).add(foodItemId));
        } catch (err) {
            alert(`Failed to mark as available: ${err.message}`);
        } finally {
            // Remove from loading set
            setOperationLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(foodItemId);
                return newSet;
            });
        }
    };

    const getAlertClass = (daysUntilExpiration) => {
        if (daysUntilExpiration <= 1) return 'alert-critical';
        if (daysUntilExpiration <= 3) return 'alert-warning';
        return 'alert-info';
    };

    const isItemAvailable = (alert) => {
        return availableItems.has(alert.foodItemId);
    };

    const isItemLoading = (alert) => {
        return operationLoading.has(alert.foodItemId);
    };

    if (loading) return <Loading message="Loading expiration alerts..." />;
    if (error) return <ErrorMessage message={error} onRetry={fetchAlerts} />;

    return (
        <div className="expiration-alerts">
            <div className="page-header">
                <h1>My Expiration Alerts</h1>
                <button className="btn-primary" onClick={fetchAlerts}>Refresh</button>
            </div>

            {alerts.length === 0 ? (
                <Card>
                    <p className="empty-state">No expiration alerts. All your items are fresh!</p>
                </Card>
            ) : (
                <div className="alerts-list">
                    {alerts.map((alert, index) => (
                        <Card key={alert.id ?? index} className={`alert-card ${getAlertClass(alert.daysUntilExpiration)}`}>
                            <div className="alert-icon">⏰</div>
                            <div className="alert-content">
                                <div className="alert-header">
                                    <h3>{alert.itemName}</h3>
                                    {isItemAvailable(alert) && (
                                        <span className="available-badge">✓ Available</span>
                                    )}
                                </div>
                                <p className="alert-message">{alert.message}</p>
                                <p className="alert-date">
                                    Expires: {new Date(alert.expirationDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="alert-actions">
                                <div className="alert-badge">
                                    {alert.daysUntilExpiration} day{alert.daysUntilExpiration !== 1 ? 's' : ''}
                                </div>
                                {!isItemAvailable(alert) && (
                                    <button
                                        className="btn-mark-available"
                                        onClick={() => handleMarkAsAvailable(alert)}
                                        disabled={isItemLoading(alert)}
                                    >
                                        {isItemLoading(alert) ? 'Marking...' : '📢 Mark as Available'}
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExpirationAlerts;
