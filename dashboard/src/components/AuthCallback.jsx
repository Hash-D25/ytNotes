import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    console.log('🔍 AuthCallback: Processing OAuth callback...');
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');

    console.log('🔍 AuthCallback: Tokens in URL:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });

    if (accessToken && refreshToken) {
      console.log('✅ AuthCallback: Storing tokens in localStorage...');
      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
      
      // Check auth status and then navigate
      checkAuthStatus().then(() => {
        console.log('✅ AuthCallback: Auth check complete, navigating to home...');
        navigate('/');
      });
    } else {
      console.log('❌ AuthCallback: No tokens found, redirecting to home...');
      // No tokens found, redirect to login
      navigate('/');
    }
  }, [navigate, checkAuthStatus]);

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 