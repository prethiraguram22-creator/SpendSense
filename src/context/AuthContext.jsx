import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, setAuthToken } from '../services/api';
import { INITIAL_USER } from '../data/demoData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await apiService.getCurrentUser();
        if (res.success && res.user) {
          setUser(res.user);
          setIsAuthenticated(true);
          setIsDemoMode(false);
        }
      } catch (err) {
        // If no server session, check if user was exploring demo mode
        const demoActive = sessionStorage.getItem('spendsense_demo_active');
        if (demoActive === '1') {
          const savedDemoUser = localStorage.getItem('spendsense_user');
          setUser(savedDemoUser ? JSON.parse(savedDemoUser) : INITIAL_USER);
          setIsAuthenticated(true);
          setIsDemoMode(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsDemoMode(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await apiService.loginUser(credentials);
      if (res.success) {
        setUser(res.user);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        sessionStorage.removeItem('spendsense_demo_active');
        return { success: true };
      }
      return { success: false, message: res.error || 'Login failed' };
    } catch (error) {
      // If server is not running, provide option for demo mode
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          isNetworkError: true,
          message: 'Backend server is not running or unreachable on port 5000.',
        };
      }
      return { success: false, message: error.message || 'Invalid credentials' };
    }
  };

  const loginDemo = () => {
    setUser(INITIAL_USER);
    setIsAuthenticated(true);
    setIsDemoMode(true);
    sessionStorage.setItem('spendsense_demo_active', '1');
  };

  const register = async (userData) => {
    try {
      const res = await apiService.registerUser(userData);
      if (res.success) {
        setUser(res.user);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        sessionStorage.removeItem('spendsense_demo_active');
        return { success: true };
      }
      return { success: false, message: res.error || 'Registration failed' };
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          isNetworkError: true,
          message: 'Backend server is not running or unreachable on port 5000.',
        };
      }
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      if (!isDemoMode) {
        await apiService.logoutUser();
      }
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsDemoMode(false);
      setAuthToken(null);
      sessionStorage.removeItem('spendsense_demo_active');
      sessionStorage.removeItem('spendsense_session_active');
    }
  };

  const updateProfile = async (updates) => {
    if (isDemoMode) {
      setUser(prev => ({ ...prev, ...updates }));
      return { success: true };
    }
    const res = await apiService.updateProfile(updates);
    if (res.success) {
      setUser(prev => ({ ...prev, ...res.user }));
      return { success: true };
    }
    return { success: false };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        isDemoMode,
        login,
        loginDemo,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
