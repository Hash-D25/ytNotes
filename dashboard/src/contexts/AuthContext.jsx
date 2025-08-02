import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import extensionBridge from '../utils/extensionBridge';

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
    console.error('Error getting stored tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

const storeTokens = (accessToken, refreshToken) => {
  try {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    console.log('✅ Tokens stored in localStorage');
    
    // Auto-sync with extension
    extensionBridge.sendTokensToExtension(accessToken, refreshToken);
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

const clearStoredTokens = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    console.log('✅ Tokens cleared from localStorage');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// Create axios instance with improved auth interceptor
const createAuthAxios = () => {
  console.log('🔧 Creating axios instance...');
  const instance = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  console.log('🔧 Axios instance created');

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log('🔧 Request interceptor - Added Authorization header');
      } else {
        console.log('⚠️ Request interceptor - No access token available');
      }
      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response) => {
      console.log('✅ Response interceptor - Request successful');
      return response;
    },
    async (error) => {
      console.log('❌ Response interceptor - Request failed:', error.response?.status);
      
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        console.log('🔄 Attempting token refresh...');
        originalRequest._retry = true;

        try {
          const { refreshToken } = getStoredTokens();
          if (!refreshToken) {
            console.log('❌ No refresh token available');
            clearStoredTokens();
            window.location.href = '/';
            return Promise.reject(error);
          }

          console.log('🔄 Calling refresh endpoint...');
          const response = await axios.post('http://localhost:5000/auth/refresh', {
            refreshToken
          });

          const { accessToken: newAccessToken } = response.data;
          console.log('✅ Token refresh successful');
          
          // Store new access token
          storeTokens(newAccessToken, refreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('🔄 Retrying original request with new token...');
          return instance(originalRequest);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
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
    console.log('🔧 Creating authAxios instance...');
    return createAuthAxios();
  });

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      
      const { accessToken } = getStoredTokens();
      
      if (!accessToken) {
        console.log('❌ No access token found');
        setIsAuthenticated(false);
        setUserProfile(null);
        return;
      }

      console.log('✅ Access token found, checking with server...');
      const response = await authAxios.get('/auth/status');
      console.log('🔍 Server response:', response.data);
      
      setIsAuthenticated(response.data.authenticated);
      
      if (response.data.authenticated && response.data.user) {
        setUserProfile(response.data.user);
        console.log('✅ User authenticated:', response.data.user.email);
      } else {
        setUserProfile(null);
        console.log('❌ User not authenticated');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
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
      console.error('Logout request failed:', error);
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
    authAxios
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 