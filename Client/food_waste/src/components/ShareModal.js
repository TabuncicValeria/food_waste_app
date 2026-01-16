import React, { useState } from 'react';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, foodItem, onShare }) => {
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    if (!isOpen || !foodItem) return null;

    const generateMessage = () => {
        const expirationDate = new Date(foodItem.expirationDate).toLocaleDateString();
        return `🍽️ ${foodItem.name} - Available for free! Expires: ${expirationDate}. Grab it before it's gone! 🌱 #FoodSharing #ZeroWaste`;
    };

    const handleShare = async () => {
        if (!selectedPlatform) {
            alert('Please select a platform');
            return;
        }

        setIsSharing(true);
        try {
            await onShare({
                platform: selectedPlatform,
                message: generateMessage(),
                foodItemId: foodItem.id,
            });
            onClose();
            setSelectedPlatform('');
        } catch (error) {
            alert(`Failed to share: ${error.message}`);
        } finally {
            setIsSharing(false);
        }
    };

    const handleCancel = () => {
        setSelectedPlatform('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Share to Social Media</h2>
                    <button className="modal-close" onClick={handleCancel}>×</button>
                </div>

                <div className="modal-body">
                    <div className="share-item-info">
                        <h3>{foodItem.name}</h3>
                        <p className="share-item-category">{foodItem.category}</p>
                    </div>

                    <div className="share-message-preview">
                        <h4>Message Preview:</h4>
                        <p className="message-text">{generateMessage()}</p>
                    </div>

                    <div className="platform-selection">
                        <h4>Choose Platform:</h4>
                        <div className="platform-options">
                            <button
                                className={`platform-btn instagram ${selectedPlatform === 'Instagram' ? 'selected' : ''}`}
                                onClick={() => setSelectedPlatform('Instagram')}
                            >
                                <span className="platform-icon">📷</span>
                                <span>Instagram</span>
                            </button>
                            <button
                                className={`platform-btn facebook ${selectedPlatform === 'Facebook' ? 'selected' : ''}`}
                                onClick={() => setSelectedPlatform('Facebook')}
                            >
                                <span className="platform-icon">👍</span>
                                <span>Facebook</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={handleCancel} disabled={isSharing}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleShare}
                        disabled={!selectedPlatform || isSharing}
                    >
                        {isSharing ? 'Sharing...' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
