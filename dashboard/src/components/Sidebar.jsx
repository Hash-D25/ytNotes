import React, { useState } from 'react';
import { BookOpenIcon, HomeIcon, HeartIcon, Bars3Icon, XMarkIcon, UserIcon, Cog6ToothIcon, BellIcon, MagnifyingGlassIcon, CloudIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, href: '/' },
  { name: 'All Notes', icon: <BookOpenIcon className="w-5 h-5" />, href: '/notes' },
  { name: 'Favorites', icon: <HeartIcon className="w-5 h-5" />, href: '/favorites' },
  { name: 'Google Drive', icon: <CloudIcon className="w-5 h-5" />, href: '/drive' },
];

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated, userProfile, logout } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl hover:bg-gray-800/50 transition-all duration-200 shadow-2xl"
      >
        <Bars3Icon className="w-5 h-5 text-gray-400" />
      </button>

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full z-50 transition-all duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64`}>
        <div className="h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <img 
                  src="/icon128.png" 
                  alt="YouTube Notes" 
                  className="w-8 h-8 rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">YouTube Notes</h1>
                <p className="text-xs text-gray-400">Bookmark Manager</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
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
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setIsMobileOpen(false)}
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
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              {isAuthenticated && userProfile?.picture ? (
                <img 
                  src={userProfile.picture} 
                  alt={userProfile.name || 'User'} 
                  className="w-10 h-10 rounded-full border-2 border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {isAuthenticated && userProfile?.name ? userProfile.name : 'User'}
                </p>
                <p className="text-xs text-gray-400">
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
        <div className="h-full bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col items-center py-6 space-y-8">
          
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
                <h1 className="text-xs font-bold text-white">YouTube</h1>
                <p className="text-xs text-gray-400">Notes</p>
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
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    {link.icon}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
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
                className="w-10 h-10 rounded-full border-2 border-gray-600 shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
            {!isCollapsed && (
              <div className="text-center">
                <p className="text-xs font-medium text-white">
                  {isAuthenticated && userProfile?.name ? userProfile.name : 'User'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 transition-colors duration-200 shadow-lg"
        >
          <Bars3Icon className="w-3 h-3 text-gray-400 mx-auto" />
        </button>
      </aside>
    </>
  );
}
