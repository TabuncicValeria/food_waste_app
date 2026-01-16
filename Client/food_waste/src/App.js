import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FoodItems from './pages/FoodItems';
import ExpirationAlerts from './pages/ExpirationAlerts';
import Claims from './pages/Claims';
import FriendGroups from './pages/FriendGroups';
import ExploreAvailableItems from './pages/ExploreAvailableItems';
import SocialFeed from './pages/SocialFeed';
import './App.css';

// Component to redirect authenticated users away from login
const LoginRedirect = () => {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
};

function AppRoutes() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Login route - redirects to / if already authenticated */}
          <Route path="/login" element={<LoginRedirect />} />

          {/* Protected Personal Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/food-items"
            element={
              <ProtectedRoute>
                <FoodItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <ExpirationAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/claims"
            element={
              <ProtectedRoute>
                <Claims />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <FriendGroups />
              </ProtectedRoute>
            }
          />

          {/* Public Explore Routes */}
          <Route path="/explore" element={<ExploreAvailableItems />} />
          <Route path="/social" element={<SocialFeed />} />

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
