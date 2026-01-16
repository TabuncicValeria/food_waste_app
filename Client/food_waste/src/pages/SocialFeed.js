import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import api from '../services/api';
import './SocialFeed.css';

const SocialFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [foodItems, setFoodItems] = useState([]);
    const [formData, setFormData] = useState({
        platform: 'Instagram',
        message: '',
        foodItemId: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch posts and food items in parallel
            const [postsData, foodItemsData] = await Promise.all([
                api.getSocialPosts(),
                api.getFoodItemsWithCategories()
            ]);

            // Build food item map
            const foodItemMap = new Map();
            foodItemsData.forEach(item => {
                foodItemMap.set(item.id, item.name);
            });

            // Enrich posts with food item names
            const enrichedPosts = postsData.map(post => ({
                ...post,
                itemName: post.foodItemId ? foodItemMap.get(post.foodItemId) : null
            }));

            setPosts(enrichedPosts);
            setFoodItems(foodItemsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setFormData({
            platform: 'Instagram',
            message: '',
            foodItemId: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.message.trim()) {
            alert('Please enter a message');
            return;
        }

        setIsSubmitting(true);
        try {
            const postData = {
                platform: formData.platform,
                message: formData.message,
                foodItemId: formData.foodItemId ? parseInt(formData.foodItemId) : null,
                postStatus: 'posted'
            };

            await api.createSocialPost(postData);

            // Refresh posts to show new post
            await fetchPosts();

            handleCloseModal();
        } catch (err) {
            alert(`Failed to create post: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Loading message="Loading social feed..." />;
    if (error) return <ErrorMessage message={error} onRetry={fetchPosts} />;

    return (
        <div className="social-feed">
            <div className="page-header">
                <h1>Social Feed</h1>
                <button className="btn-primary" onClick={handleCreatePost}>Create Post</button>
            </div>

            {posts.length === 0 ? (
                <Card>
                    <p className="empty-state">No posts yet. Share your food waste reduction journey!</p>
                </Card>
            ) : (
                <div className="posts-list">
                    {posts.map((post, index) => (
                        <Card key={post.id ?? index} className="post-card">
                            <div className="post-header">
                                <div className="post-author">
                                    <div className="author-avatar">{post.userName?.charAt(0) || '?'}</div>
                                    <div className="author-info">
                                        <h4>{post.userName}</h4>
                                        <span className="post-date">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                {post.platform && (
                                    <span className="post-platform">{post.platform}</span>
                                )}
                            </div>
                            <div className="post-content">
                                <p>{post.content}</p>
                                {post.itemName && (
                                    <span className="post-item-tag">🍽️ {post.itemName}</span>
                                )}
                            </div>
                            <div className="post-footer">
                                <button className="post-action">
                                    <span>👍</span>
                                    <span>{post.likes || 0}</span>
                                </button>
                                <button className="post-action">
                                    <span>💬</span>
                                    <span>{post.comments || 0}</span>
                                </button>
                                <button className="post-action">
                                    <span>🔄</span>
                                    <span>Share</span>
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Post Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content create-post-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Post</h2>
                            <button className="modal-close" onClick={handleCloseModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Platform</label>
                                    <select
                                        value={formData.platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                        required
                                    >
                                        <option value="Instagram">Instagram</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Twitter">Twitter</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Share your food waste reduction story..."
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Related Food Item (Optional)</label>
                                    <select
                                        value={formData.foodItemId}
                                        onChange={(e) => setFormData({ ...formData, foodItemId: e.target.value })}
                                    >
                                        <option value="">None</option>
                                        {foodItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialFeed;
