import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { extensionBridge } from '../utils/extensionBridge';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// JWT token management functions
const getStoredTokens = () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  } catch (error) {
    return { accessToken: null, refreshToken: null };
  }
};

const storeTokens = (accessToken, refreshToken) => {
  try {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    
    // Auto-sync with extension
    extensionBridge.sendTokensToExtension(accessToken, refreshToken);
  } catch (error) {
    // Handle error silently
  }
};

const clearStoredTokens = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
  } catch (error) {
    // Handle error silently
  }
};

// Create axios instance with improved auth interceptor
const createAuthAxios = () => {
  const instance = axios.create({
    baseURL: 'https://ytnotes-server.onrender.com',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const { refreshToken } = getStoredTokens();
          if (!refreshToken) {
            clearStoredTokens();
            window.location.href = '/';
            return Promise.reject(error);
          }

          const response = await axios.post('https://ytnotes-server.onrender.com/auth/refresh', {
            refreshToken
          });

          const { accessToken: newAccessToken } = response.data;
          
          // Store new access token
          storeTokens(newAccessToken, refreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          clearStoredTokens();
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authAxios] = useState(() => {
    return createAuthAxios();
  });

  // Admin email addresses from environment variables
  const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS ? 
    import.meta.env.VITE_ADMIN_EMAILS.split(',').map(email => email.trim()) : 
    ['seenew1729@gmail.com']; // Fallback for development

  // Check if current user is admin
  const isAdmin = () => {
    const isAdminUser = userProfile && ADMIN_EMAILS.includes(userProfile.email);
    return isAdminUser;
  };

  const checkAuthStatus = async () => {
    try {
      const { accessToken } = getStoredTokens();
      
      if (!accessToken) {
        setIsAuthenticated(false);
        setUserProfile(null);
        return;
      }

      const response = await authAxios.get('/auth/status');
      
      setIsAuthenticated(response.data.authenticated);
      
      if (response.data.authenticated && response.data.user) {
        setUserProfile(response.data.user);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAxios.post('/auth/logout');
    } catch (error) {
      // Handle error silently
    } finally {
      clearStoredTokens();
      
      // Clear extension tokens
      extensionBridge.sendTokensToExtension(null, null);
      
      setIsAuthenticated(false);
      setUserProfile(null);
      window.location.reload();
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Initialize extension bridge for auto-sync
    extensionBridge.init();
  }, []);

  useEffect(() => {
    // Check auth status every 5 minutes (instead of 30 seconds to reduce load)
    const interval = setInterval(checkAuthStatus, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    isAuthenticated,
    userProfile,
    loading,
    checkAuthStatus,
    logout,
    authAxios,
    isAdmin: isAdmin()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 