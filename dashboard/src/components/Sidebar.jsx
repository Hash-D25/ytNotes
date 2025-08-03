import React, { useState } from 'react';
import { BookOpenIcon, HomeIcon, HeartIcon, Bars3Icon, XMarkIcon, UserIcon, Cog6ToothIcon, BellIcon, MagnifyingGlassIcon, CloudIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated, userProfile, logout, isAdmin } = useAuth();

  const NAV_LINKS = [
    { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, href: '/' },
    { name: 'All Notes', icon: <BookOpenIcon className="w-5 h-5" />, href: '/notes' },
    { name: 'Favorites', icon: <HeartIcon className="w-5 h-5" />, href: '/favorites' },
    { name: 'Google Drive', icon: <CloudIcon className="w-5 h-5" />, href: '/drive' },
    // Admin link - only show if user is admin
    ...(isAdmin ? [{ name: 'Admin', icon: <ShieldCheckIcon className="w-5 h-5" />, href: '/admin' }] : []),
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 dark:bg-gray-900/95 bg-white/95 backdrop-blur-xl border dark:border-gray-700/50 border-gray-200/50 rounded-xl dark:hover:bg-gray-800/50 hover:bg-gray-100/50 transition-all duration-200 shadow-2xl"
      >
        <Bars3Icon className="w-5 h-5 dark:text-gray-400 text-gray-600" />
      </button>

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full z-50 transition-all duration-300 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64`}>
        <div className="h-full dark:bg-gray-900/95 bg-white/95 backdrop-blur-xl border-r dark:border-gray-700/50 border-gray-200/50 flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <img 
                  src="/icon128.png" 
                  alt="YouTube Notes" 
                  className="w-8 h-8 rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold dark:text-white text-gray-900">YouTube Notes</h1>
                <p className="text-xs dark:text-gray-400 text-gray-600">Bookmark Manager</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 rounded-lg dark:hover:bg-gray-800 hover:bg-gray-100 transition-colors duration-200"
            >
              <XMarkIcon className="w-5 h-5 dark:text-gray-400 text-gray-600" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {NAV_LINKS.map(link => {
              const isActive = location.pathname === link.href || 
                (link.href !== '/' && location.pathname.startsWith(link.href));
              
              return (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg' 
                      : 'dark:text-gray-400 text-gray-600 dark:hover:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:text-white hover:text-gray-900'
                  }`}
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <span className="flex items-center justify-center w-6 h-6">
                    {link.icon}
                  </span>
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t dark:border-gray-700 border-gray-200">
            <div className="flex items-center space-x-3">
              {isAuthenticated && userProfile?.picture ? (
                <img 
                  src={userProfile.picture} 
                  alt={userProfile.name || 'User'} 
                  className="w-10 h-10 rounded-full border-2 dark:border-gray-600 border-gray-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium dark:text-white text-gray-900">
                  {isAuthenticated && userProfile?.name ? userProfile.name : 'User'}
                </p>
                <p className="text-xs dark:text-gray-400 text-gray-600">
                  {isAuthenticated && userProfile?.email ? userProfile.email : 'Guest'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Floating Ribbon Sidebar */}
      <aside className={`hidden lg:block fixed top-4 left-4 h-[calc(100vh-2rem)] z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-20'
      }`}>
        
        {/* Main Ribbon Container */}
        <div className="h-full dark:bg-gray-900/95 bg-white/95 backdrop-blur-xl border dark:border-gray-700/50 border-gray-200/50 rounded-2xl shadow-2xl flex flex-col items-center py-6 space-y-8">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src="/icon128.png" 
                alt="YouTube Notes" 
                className="w-8 h-8 rounded-lg"
              />
            </div>
            {!isCollapsed && (
              <div className="text-center">
                <h1 className="text-xs font-bold dark:text-white text-gray-900">YouTube</h1>
                <p className="text-xs dark:text-gray-400 text-gray-600">Notes</p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col space-y-2">
            {NAV_LINKS.map(link => {
              const isActive = location.pathname === link.href || 
                (link.href !== '/' && location.pathname.startsWith(link.href));
              
              return (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className={`group relative p-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg' 
                      : 'dark:text-gray-400 text-gray-600 dark:hover:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:text-white hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    {link.icon}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-16 dark:bg-gray-800 bg-gray-100 border dark:border-gray-700 border-gray-300 rounded-lg px-2 py-1 text-xs dark:text-white text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {link.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="flex flex-col items-center space-y-2">
            {isAuthenticated && userProfile?.picture ? (
              <img 
                src={userProfile.picture} 
                alt={userProfile.name || 'User'} 
                className="w-10 h-10 rounded-full border-2 dark:border-gray-600 border-gray-300 shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
            {!isCollapsed && (
              <div className="text-center">
                <p className="text-xs font-medium dark:text-white text-gray-900">
                  {isAuthenticated && userProfile?.name ? userProfile.name : 'User'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 dark:bg-gray-800 bg-gray-100 border dark:border-gray-700 border-gray-300 rounded-full dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors duration-200 shadow-lg"
        >
          <Bars3Icon className="w-3 h-3 dark:text-gray-400 text-gray-600 mx-auto" />
        </button>
      </aside>
    </>
  );
}
