import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import FoodItemForm from '../components/FoodItemForm';
import ShareModal from '../components/ShareModal';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import { syncAlertForItem } from '../services/alertSync';
import './FoodItems.css';

const FoodItems = () => {
    const { currentUserId } = useUser();
    const [foodItems, setFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [operationLoading, setOperationLoading] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingItem, setSharingItem] = useState(null);

    const fetchFoodItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getFoodItemsWithCategories();
            // Filter to show only current user's items
            const myItems = data.filter(item => item.userId === currentUserId);
            setFoodItems(myItems);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFoodItems();
    }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            return;
        }

        try {
            setOperationLoading(true);
            await api.deleteFoodItem(item.id);
            // Instantly update the list
            setFoodItems(prev => prev.filter(i => i.id !== item.id));
        } catch (err) {
            alert(`Failed to delete item: ${err.message}`);
        } finally {
            setOperationLoading(false);
        }
    };

    const handleSubmit = async (formData) => {
        try {
            setOperationLoading(true);

            if (editingItem) {
                // Update existing item
                await api.updateFoodItem(editingItem.id, formData);
                // Refresh the list to get updated data
                await fetchFoodItems();

                // Sync alert for updated item
                await syncAlertForItem(
                    editingItem.id,
                    formData.expirationDate,
                    formData.status
                );
            } else {
                // Create new item - inject UserId
                const newItem = await api.createFoodItem({
                    ...formData,
                    userId: currentUserId
                });
                // Refresh the list to get new item
                await fetchFoodItems();

                // Sync alert for new item
                if (newItem && newItem.FoodItemId) {
                    await syncAlertForItem(
                        newItem.FoodItemId,
                        formData.expirationDate,
                        formData.status
                    );
                }
            }

            setIsModalOpen(false);
            setEditingItem(null);
        } catch (err) {
            throw new Error(`Failed to ${editingItem ? 'update' : 'create'} item: ${err.message}`);
        } finally {
            setOperationLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleShare = (item) => {
        setSharingItem(item);
        setIsShareModalOpen(true);
    };

    const handleShareSubmit = async (shareData) => {
        try {
            await api.createSocialPost(shareData);
            alert('Successfully shared to ' + shareData.platform + '!');
        } catch (err) {
            throw new Error(`Failed to share: ${err.message}`);
        }
    };

    return (
        <div className="page-container">
            <div className="food-items">
                <div className="page-header">
                    <h1>My Food Items</h1>
                    <button className="btn-primary" onClick={handleCreate}>
                        Add New Item
                    </button>
                </div>

                {foodItems.length === 0 ? (
                    <Card>
                        <p className="empty-state">Your fridge is empty. Add your first item to get started!</p>
                    </Card>
                ) : (
                    <div className="items-grid">
                        {foodItems.map((item, index) => (
                            <Card key={item.id ?? index} className="food-item-card" hover>
                                <div className="item-header">
                                    <h3>{item.name}</h3>
                                    <span className="item-category">{item.category}</span>
                                </div>
                                <div className="item-details">
                                    <p><strong>Quantity:</strong> {item.quantity}</p>
                                    <p><strong>Expiration:</strong> {new Date(item.expirationDate).toLocaleDateString()}</p>
                                </div>
                                <div className="item-actions">
                                    {item.status === 'disponibil' && (
                                        <button
                                            className="btn-share"
                                            onClick={() => handleShare(item)}
                                        >
                                            📢 Share
                                        </button>
                                    )}
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEdit(item)}
                                        disabled={operationLoading}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(item)}
                                        disabled={operationLoading}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCancel}
                    title={editingItem ? 'Edit Food Item' : 'Add New Food Item'}
                >
                    <FoodItemForm
                        item={editingItem}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                    />
                </Modal>

                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    foodItem={sharingItem}
                    onShare={handleShareSubmit}
                />
            </div>
        </div>
    );
};

export default FoodItems;
