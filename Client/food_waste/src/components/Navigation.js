import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Navigation.css';

const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, currentUserName, logout } = useUser();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Personal routes (require authentication)
    const personalNavItems = [
        { path: '/', label: 'My Dashboard', icon: '🏠' },
        { path: '/food-items', label: 'My Food Items', icon: '🍎' },
        { path: '/alerts', label: 'My Alerts', icon: '⏰' },
        { path: '/claims', label: 'My Claims', icon: '✋' },
        { path: '/groups', label: 'My Groups', icon: '👥' },
    ];

    // Public routes (always visible)
    const publicNavItems = [
        { path: '/explore', label: 'Explore Food', icon: '🔍' },
        { path: '/social', label: 'Social Feed', icon: '💬' },
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    // Don't show navigation on login page
    if (location.pathname === '/login') {
        return null;
    }

    return (
        <nav className="navigation">
            <div className="nav-container">
                <div className="nav-brand">
                    <span className="nav-logo">🌱</span>
                    <h1 className="nav-title">Food Waste App</h1>
                </div>

                <button
                    className="nav-mobile-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>

                <ul className={`nav-menu ${isMobileMenuOpen ? 'nav-menu-open' : ''}`}>
                    {/* Personal section - only when authenticated */}
                    {isAuthenticated && (
                        <>
                            {personalNavItems.map((item) => (
                                <li key={item.path} className="nav-item">
                                    <Link
                                        to={item.path}
                                        className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        <span className="nav-label">{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                            <li className="nav-divider"></li>
                        </>
                    )}

                    {/* Public section - always visible */}
                    {publicNavItems.map((item) => (
                        <li key={item.path} className="nav-item">
                            <Link
                                to={item.path}
                                className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        </li>
                    ))}

                    {/* Auth section */}
                    {isAuthenticated ? (
                        <>
                            <li className="nav-divider"></li>
                            <li className="nav-item nav-user">
                                <span className="nav-user-info">
                                    <span className="nav-user-icon">👤</span>
                                    <span className="nav-user-name">{currentUserName}</span>
                                </span>
                            </li>
                            <li className="nav-item">
                                <button
                                    className="nav-link nav-logout"
                                    onClick={handleLogout}
                                >
                                    <span className="nav-icon">🚪</span>
                                    <span className="nav-label">Logout</span>
                                </button>
                            </li>
                        </>
                    ) : (
                        <li className="nav-item">
                            <Link
                                to="/login"
                                className="nav-link"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="nav-icon">🔑</span>
                                <span className="nav-label">Login</span>
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navigation;
