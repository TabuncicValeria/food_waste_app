import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState(null);

    // Hydrate from localStorage on mount
    useEffect(() => {
        const authData = localStorage.getItem('auth');
        if (authData) {
            try {
                const { isAuthenticated, currentUserId, currentUserName } = JSON.parse(authData);
                if (isAuthenticated && currentUserId) {
                    setIsAuthenticated(true);
                    setCurrentUserId(currentUserId);
                    setCurrentUserName(currentUserName);
                }
            } catch (err) {
                console.error('Failed to parse auth data:', err);
                localStorage.removeItem('auth');
            }
        }
    }, []);

    const login = (user) => {
        setIsAuthenticated(true);
        setCurrentUserId(user.userId);
        setCurrentUserName(user.userName);

        // Persist to localStorage
        localStorage.setItem('auth', JSON.stringify({
            isAuthenticated: true,
            currentUserId: user.userId,
            currentUserName: user.userName
        }));
    };

    const logout = () => {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setCurrentUserName(null);

        // Clear localStorage
        localStorage.removeItem('auth');
    };

    const value = {
        isAuthenticated,
        currentUserId,
        currentUserName,
        login,
        logout
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
};
