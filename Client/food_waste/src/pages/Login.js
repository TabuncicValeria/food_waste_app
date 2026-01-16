import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import './Login.css';

const Login = () => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { login } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.request('/users');
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedUserId) {
            alert('Please select a user');
            return;
        }

        const selectedUser = users.find(u => u.UserId === parseInt(selectedUserId));
        if (!selectedUser) {
            alert('User not found');
            return;
        }

        login({
            userId: selectedUser.UserId,
            userName: selectedUser.UserName
        });

        navigate('/');
    };

    if (loading) return <Loading message="Loading users..." />;
    if (error) return <div className="login-error">Error: {error}</div>;

    return (
        <div className="login-page">
            <Card className="login-card">
                <div className="login-header">
                    <h1>🍽️ Food Waste App</h1>
                    <p>Login to manage your fridge and explore available food</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Select User</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            required
                        >
                            <option value="">Choose a user...</option>
                            {users.map(user => (
                                <option key={user.UserId} value={user.UserId}>
                                    {user.UserName} ({user.Email})
                                </option>
                            ))}
                        </select>
                        <p className="form-help">
                            Select your account to continue
                        </p>
                    </div>

                    <button type="submit" className="btn-primary btn-login">
                        Login
                    </button>
                </form>

                <div className="login-footer">
                    <p>Demo app - Select any user to login</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
