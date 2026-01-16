import {
    normalizeFoodItem,
    normalizeExpirationAlert,
    normalizeClaim,
    normalizeFriendGroup,
    normalizeSocialPost,
    normalizeArray,
    buildCategoryMap,
    buildMemberCountMap,
} from './dataAdapters.js';

const API_BASE_URL = 'http://localhost:9000/api';

class ApiService {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Food Items
    async getFoodItems() {
        const data = await this.request('/fooditems');
        return normalizeArray(data, normalizeFoodItem);
    }

    // Food Items with category names (enriched)
    async getFoodItemsWithCategories() {
        const [foodItems, categories] = await Promise.all([
            this.request('/fooditems'),
            this.request('/categories')
        ]);

        const categoryMap = buildCategoryMap(categories);
        return normalizeArray(foodItems, normalizeFoodItem, categoryMap);
    }

    // Categories
    async getCategories() {
        return this.request('/categories');
    }

    // Food Items CRUD operations
    async createFoodItem(data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {
            FoodName: data.name,
            Quantity: data.quantity,
            ExpirationDate: data.expirationDate,
            CategoryId: data.categoryId,
            UserId: data.userId || 1, // Default user ID if not provided
            Status: data.status || 'normal',
        };
        return this.request('/fooditems', {
            method: 'POST',
            body: JSON.stringify(backendData),
        });
    }

    async updateFoodItem(id, data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {
            FoodName: data.name,
            Quantity: data.quantity,
            ExpirationDate: data.expirationDate,
            CategoryId: data.categoryId,
            Status: data.status,
        };
        return this.request(`/fooditems/${id}`, {
            method: 'PUT',
            body: JSON.stringify(backendData),
        });
    }

    async deleteFoodItem(id) {
        return this.request(`/fooditems/${id}`, {
            method: 'DELETE',
        });
    }

    // Availability
    async getAvailability() {
        return this.request('/availability');
    }

    async createAvailability(data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {
            FoodItemId: data.foodItemId,
            OwnerId: data.ownerId || 1, // Default owner ID if not provided
            AvailableFrom: data.availableFrom || new Date().toISOString(),
        };
        return this.request('/availability', {
            method: 'POST',
            body: JSON.stringify(backendData),
        });
    }

    // Helper method to mark a food item as available
    // This creates an availability entry AND updates the food item status
    async markFoodItemAsAvailable(foodItemId, ownerId = 1) {
        try {
            // Create availability entry
            const availability = await this.createAvailability({
                foodItemId,
                ownerId,
            });

            // Update food item status to 'disponibil' (available)
            await this.updateFoodItem(foodItemId, {
                status: 'disponibil',
            });

            return availability;
        } catch (error) {
            // If availability already exists (unique constraint), just update status
            if (error.message.includes('unique') || error.message.includes('duplicate')) {
                await this.updateFoodItem(foodItemId, {
                    status: 'disponibil',
                });
                return { message: 'Item already marked as available' };
            }
            throw error;
        }
    }

    // Expiration Alerts
    async getExpirationAlerts() {
        const data = await this.request('/expirationalerts');
        return normalizeArray(data, normalizeExpirationAlert);
    }

    async createExpirationAlert(data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {
            FoodItemId: data.foodItemId,
            AlertDate: data.alertDate || new Date().toISOString(),
            AlertStatus: data.alertStatus || 'active'
        };
        return this.request('/expirationalerts', {
            method: 'POST',
            body: JSON.stringify(backendData),
        });
    }

    // Claims
    async getClaims() {
        const data = await this.request('/claims');
        return normalizeArray(data, normalizeClaim);
    }

    async createClaim(data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {
            UserId: data.userId || 1, // Default user ID if not provided
            FoodItemId: data.foodItemId,
            ClaimDate: data.claimDate || new Date().toISOString(),
            ClaimStatus: data.claimStatus || 'pending',
        };
        return this.request('/claims', {
            method: 'POST',
            body: JSON.stringify(backendData),
        });
    }

    async updateClaim(claimId, data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {};
        if (data.status !== undefined) {
            backendData.ClaimStatus = data.status;
        }
        if (data.pickupLocation !== undefined) {
            backendData.PickupLocation = data.pickupLocation;
        }
        return this.request(`/claims/${claimId}`, {
            method: 'PUT',
            body: JSON.stringify(backendData),
        });
    }

    // Helper method to claim a food item
    // This creates a claim entry AND updates the food item status
    async claimFoodItem(foodItemId, userId = 1) {
        try {
            // Create claim entry
            const claim = await this.createClaim({
                foodItemId,
                userId,
            });

            // Update food item status to 'claimed'
            await this.updateFoodItem(foodItemId, {
                status: 'claimed',
            });

            return claim;
        } catch (error) {
            throw error;
        }
    }

    // Friend Groups
    async getFriendGroups() {
        const data = await this.request('/friendgroups');
        return normalizeArray(data, normalizeFriendGroup);
    }

    // Friend Groups with member counts (enriched)
    async getFriendGroupsWithMembers() {
        const [groups, members] = await Promise.all([
            this.request('/friendgroups'),
            this.request('/groupmembers')
        ]);

        const memberCountMap = buildMemberCountMap(members);
        return normalizeArray(groups, normalizeFriendGroup, memberCountMap);
    }

    async createFriendGroup(data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {
            GroupName: data.groupName || data.name,
            OwnerId: data.ownerId || 1, // Default owner ID
            Description: data.description || ''
        };
        return this.request('/friendgroups', {
            method: 'POST',
            body: JSON.stringify(backendData),
        });
    }

    // Group Members
    async getGroupMembers() {
        return this.request('/groupmembers');
    }

    async createGroupMember(data) {
        return this.request('/groupmembers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Social Posts
    async getSocialPosts() {
        const data = await this.request('/socialposts');
        return normalizeArray(data, normalizeSocialPost);
    }

    async createSocialPost(data) {
        // Convert camelCase to PascalCase for backend
        const backendData = {
            Platform: data.platform,
            Message: data.message,
            PostStatus: data.postStatus || 'posted',
            FoodItemId: data.foodItemId,
        };
        return this.request('/socialposts', {
            method: 'POST',
            body: JSON.stringify(backendData),
        });
    }

}

export default new ApiService();
