/**
 * Data Adapters/Normalizers
 * Converts backend PascalCase Sequelize fields to frontend camelCase
 */

/**
 * Normalize FoodItem from backend to frontend format
 * Backend: FoodItemId, FoodName, Quantity, ExpirationDate, Status, UserId, CategoryId
 * Frontend: id, name, quantity, expirationDate, status, userId, categoryId, category
 * @param {Object} item - Raw food item from backend
 * @param {Map} categoryMap - Optional map of CategoryId -> CategoryName
 */
export const normalizeFoodItem = (item, categoryMap = null) => {
    if (!item) return null;

    // Try to get category name from map, joined data, or use fallback
    let categoryName = 'Unknown';
    if (categoryMap && item.CategoryId) {
        categoryName = categoryMap.get(item.CategoryId) || 'Unknown';
    } else if (item.Category?.CategoryName) {
        categoryName = item.Category.CategoryName;
    }

    return {
        id: item.FoodItemId,
        name: item.FoodName,
        quantity: item.Quantity,
        expirationDate: item.ExpirationDate,
        status: item.Status,
        userId: item.UserId,
        categoryId: item.CategoryId,
        category: categoryName,
    };
};

/**
 * Normalize ExpirationAlert from backend to frontend format
 * Backend: AlertId, AlertDate, AlertStatus, FoodItemId
 * Frontend: id, itemName, message, expirationDate, daysUntilExpiration
 */
export const normalizeExpirationAlert = (alert) => {
    if (!alert) return null;

    const alertDate = new Date(alert.AlertDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((alertDate - today) / (1000 * 60 * 60 * 24));

    return {
        id: alert.AlertId,
        itemName: alert.FoodItem?.FoodName || `Item #${alert.FoodItemId}`, // Fallback if no join
        message: `This item will expire in ${daysUntilExpiration} days`,
        expirationDate: alert.AlertDate,
        daysUntilExpiration: daysUntilExpiration,
        status: alert.AlertStatus,
        foodItemId: alert.FoodItemId,
    };
};

/**
 * Normalize Claim from backend to frontend format
 * Backend: ClaimId, ClaimDate, ClaimStatus, UserId, FoodItemId
 * Frontend: id, itemName, userName, claimDate, status, pickupLocation
 */
export const normalizeClaim = (claim) => {
    if (!claim) return null;

    return {
        id: claim.ClaimId,
        itemName: claim.FoodItem?.FoodName || `Item #${claim.FoodItemId}`, // Fallback if no join
        userName: claim.User?.UserName || `User #${claim.UserId}`, // Fallback if no join
        claimDate: claim.ClaimDate,
        status: claim.ClaimStatus,
        userId: claim.UserId,
        foodItemId: claim.FoodItemId,
        pickupLocation: claim.PickupLocation || 'Not specified', // Fallback if field doesn't exist
    };
};

/**
 * Normalize FriendGroup from backend to frontend format
 * Backend: GroupId, GroupName, OwnerId, CreatedAt
 * Frontend: id, name, description, memberCount, itemsShared
 * @param {Object} group - Raw friend group from backend
 * @param {Map} memberCountMap - Optional map of GroupId -> member count
 */
export const normalizeFriendGroup = (group, memberCountMap = null) => {
    if (!group) return null;

    // Get member count from map or use fallback
    let memberCount = 0;
    if (memberCountMap && group.GroupId) {
        memberCount = memberCountMap.get(group.GroupId) || 0;
    } else if (group.MemberCount !== undefined) {
        memberCount = group.MemberCount;
    }

    return {
        id: group.GroupId,
        name: group.GroupName,
        description: group.Description || 'No description', // Fallback if field doesn't exist
        ownerId: group.OwnerId,
        createdAt: group.CreatedAt,
        memberCount: memberCount,
        itemsShared: group.ItemsShared || 0, // Note: itemsShared not available from current API endpoints
    };
};

/**
 * Normalize SocialPost from backend to frontend format
 * Backend: SocialPostId, Platform, Message, PostDate, PostStatus, FoodItemId
 * Frontend: id, userName, content, createdAt, likes, comments
 */
export const normalizeSocialPost = (post) => {
    if (!post) return null;

    return {
        id: post.SocialPostId,
        userName: post.User?.UserName || post.FoodItem?.User?.UserName || 'Anonymous', // Fallback if no join
        content: post.Message,
        createdAt: post.PostDate,
        platform: post.Platform,
        status: post.PostStatus,
        foodItemId: post.FoodItemId,
        likes: post.Likes || 0, // Fallback if field doesn't exist
        comments: post.Comments || 0, // Fallback if field doesn't exist
    };
};

/**
 * Normalize array of items using the appropriate normalizer
 * @param {Array} items - Array of items to normalize
 * @param {Function} normalizer - Normalizer function to apply
 * @param {*} lookupData - Optional lookup data (map, object, etc.) to pass to normalizer
 */
export const normalizeArray = (items, normalizer, lookupData = null) => {
    if (!Array.isArray(items)) return [];
    return items.map(item => normalizer(item, lookupData));
};

/**
 * Build a category lookup map from categories array
 * @param {Array} categories - Array of category objects from backend
 * @returns {Map} Map of CategoryId -> CategoryName
 */
export const buildCategoryMap = (categories) => {
    const map = new Map();
    if (!Array.isArray(categories)) return map;

    categories.forEach(cat => {
        if (cat.CategoryId && cat.CategoryName) {
            map.set(cat.CategoryId, cat.CategoryName);
        }
    });

    return map;
};

/**
 * Build a member count map from group members array
 * @param {Array} members - Array of group member objects from backend
 * @returns {Map} Map of GroupId -> member count
 */
export const buildMemberCountMap = (members) => {
    const map = new Map();
    if (!Array.isArray(members)) return map;

    members.forEach(member => {
        const groupId = member.GroupId;
        if (groupId) {
            map.set(groupId, (map.get(groupId) || 0) + 1);
        }
    });

    return map;
};
