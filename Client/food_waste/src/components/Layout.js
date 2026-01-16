import React from 'react';
import Navigation from './Navigation';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Navigation />
            <main className="layout-main">
                <div className="layout-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
