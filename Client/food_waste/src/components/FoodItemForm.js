import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './FoodItemForm.css';

const FoodItemForm = ({ item, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        expirationDate: '',
        categoryId: '',
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategories();

        // If editing, populate form with existing data
        if (item) {
            setFormData({
                name: item.name || '',
                quantity: item.quantity || '',
                expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
                categoryId: item.categoryId || '',
            });
        }
    }, [item]);

    const fetchCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate
            if (!formData.name || !formData.quantity || !formData.expirationDate || !formData.categoryId) {
                throw new Error('Please fill in all fields');
            }

            // Convert quantity to number
            const submitData = {
                ...formData,
                quantity: parseInt(formData.quantity, 10),
                categoryId: parseInt(formData.categoryId, 10),
            };

            await onSubmit(submitData);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <form className="food-item-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="name">Food Name *</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Apples"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    min="1"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="expirationDate">Expiration Date *</label>
                <input
                    type="date"
                    id="expirationDate"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="categoryId">Category *</label>
                <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                        <option key={cat.CategoryId} value={cat.CategoryId}>
                            {cat.CategoryName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
                    Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (item ? 'Update' : 'Create')}
                </button>
            </div>
        </form>
    );
};

export default FoodItemForm;
