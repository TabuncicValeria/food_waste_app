/**
 * Alert Sync Utility
 * Automatically synchronizes expiration alerts based on food item expiration dates
 */

import api from './api';

/**
 * Sync expiration alerts for all food items
 * Creates alerts for items expiring in <= 3 days that don't have alerts yet
 * 
 * @returns {Promise<{created: number, skipped: number}>} Sync results
 */
export const syncExpirationAlerts = async () => {
    try {
        // Fetch food items and existing alerts in parallel
        const [foodItems, existingAlerts] = await Promise.all([
            api.getFoodItemsWithCategories(),
            api.getExpirationAlerts()
        ]);

        // Build map of existing alerts by FoodItemId
        const alertMap = new Map();
        existingAlerts.forEach(alert => {
            alertMap.set(alert.foodItemId, alert);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let created = 0;
        let skipped = 0;

        // Check each food item
        for (const item of foodItems) {
            // Skip claimed items
            if (item.status === 'claimed') {
                continue;
            }

            const expirationDate = new Date(item.expirationDate);
            expirationDate.setHours(0, 0, 0, 0);

            // Calculate days until expiration
            const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

            // Should have alert if expires in <= 3 days
            const shouldHaveAlert = daysUntilExpiration <= 3 && daysUntilExpiration >= 0;

            if (shouldHaveAlert) {
                // Check if alert already exists
                if (alertMap.has(item.id)) {
                    skipped++;
                    continue;
                }

                // Create new alert
                try {
                    await api.createExpirationAlert({
                        foodItemId: item.id,
                        alertDate: item.expirationDate,
                        alertStatus: 'active'
                    });
                    created++;
                } catch (err) {
                    console.error(`Failed to create alert for item ${item.id}:`, err.message);
                }
            }
        }

        return { created, skipped };
    } catch (err) {
        console.error('Alert sync failed:', err);
        throw err;
    }
};

/**
 * Sync alerts for a specific food item
 * Useful after creating or updating a single item
 * 
 * @param {number} foodItemId - ID of the food item
 * @param {string} expirationDate - Expiration date of the item
 * @param {string} status - Status of the item
 */
export const syncAlertForItem = async (foodItemId, expirationDate, status) => {
    try {
        // Skip claimed items
        if (status === 'claimed') {
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expDate = new Date(expirationDate);
        expDate.setHours(0, 0, 0, 0);

        const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

        // Should have alert if expires in <= 3 days
        const shouldHaveAlert = daysUntilExpiration <= 3 && daysUntilExpiration >= 0;

        if (shouldHaveAlert) {
            // Check if alert already exists
            const existingAlerts = await api.getExpirationAlerts();
            const hasAlert = existingAlerts.some(alert => alert.foodItemId === foodItemId);

            if (!hasAlert) {
                // Create new alert
                await api.createExpirationAlert({
                    foodItemId,
                    alertDate: expirationDate,
                    alertStatus: 'active'
                });
            }
        }
    } catch (err) {
        console.error(`Failed to sync alert for item ${foodItemId}:`, err.message);
        // Don't throw - alert sync failure shouldn't break the main flow
    }
};
