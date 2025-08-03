import React, { useRef, useEffect, useState } from 'react';
import { MagnifyingGlassIcon, ArrowsUpDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

export default function Header({ search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder, currentPage = 'home', isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const searchInputRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setIsMobileSearchExpanded(false);
        setIsDropdownOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMobileSearchClick = () => {
    setIsMobileSearchExpanded(!isMobileSearchExpanded);
    if (!isMobileSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    setIsMobileSearchExpanded(false);
  };

  const handleMobileHamburgerClick = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const getSortOptions = () => {
    switch (currentPage) {
      case 'home':
      case 'favorites':
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'title', label: 'Title' },
          { value: 'favorite', label: 'Favorites' }
        ];
      case 'notes':
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'timestamp', label: 'By Timestamp' },
          { value: 'title', label: 'By Video Title' }
        ];
      case 'video':
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'timestamp', label: 'By Timestamp' }
        ];
      case 'drive':
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'title', label: 'Title' }
        ];
      default:
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'title', label: 'Title' }
        ];
    }
  };

  const handleOptionSelect = (value) => {
    setSortBy(value);
    setIsDropdownOpen(false);
  };

  const currentSortLabel = getSortOptions().find(opt => opt.value === sortBy)?.label || 'Sort By';
  const sortOptions = getSortOptions();

  return (
    <header className="top-0 px-4 sm:px-6 lg:px-8 py-4 absolute youtube-header" style={{ zIndex: 999999, backgroundColor: '#151515', left: 0, right: 0 }}>
      <div className="flex items-center justify-between">
        {/* Left Section - Page Title + Mobile Hamburger */}
        <div className="flex items-center space-x-4 lg:ml-28">
          {/* Mobile Hamburger - only visible on mobile */}
          <button 
            onClick={handleMobileHamburgerClick}
            className="lg:hidden p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
            style={{
              backgroundColor: document.documentElement.classList.contains('dark') ? '#242424' : '#FFFFFF',
              borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
            }}
          >
            <Bars3Icon className="w-5 h-5 dark:text-gray-400 text-gray-600" />
          </button>
          
          {/* Page Title - hidden on mobile when search is expanded */}
          <h1 className={`text-xl font-semibold dark:text-white text-gray-900 hidden sm:block ${isMobileSearchExpanded ? 'lg:hidden' : ''}`}>
            {currentPage === 'home' && 'Dashboard'}
            {currentPage === 'favorites' && 'Favorites'}
            {currentPage === 'notes' && 'All Notes'}
            {currentPage === 'video' && 'Video Notes'}
          </h1>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-4 lg:ml-8">
          {/* Desktop Search - unchanged */}
          <div className="hidden lg:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 dark:text-gray-400 text-gray-500" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search videos... (Press / to focus)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="youtube-input w-full pl-10 pr-4 py-2 text-sm"
            />
          </div>

          {/* Mobile Search - expandable */}
          <div className="lg:hidden">
            {isMobileSearchExpanded ? (
              <form onSubmit={handleMobileSearchSubmit} className="w-full">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search videos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="youtube-input w-full pl-4 pr-12 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchExpanded(false)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="w-5 h-5 dark:text-gray-400 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={handleMobileSearchClick}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                style={{
                  backgroundColor: document.documentElement.classList.contains('dark') ? '#242424' : '#FFFFFF',
                  borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                }}
              >
                <MagnifyingGlassIcon className="w-5 h-5 dark:text-gray-400 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Right Section - Sort Controls */}
        <div className={`flex items-center space-x-3 ${isMobileSearchExpanded ? 'lg:flex hidden' : ''}`}>
          {/* Sort By Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="youtube-button flex items-center space-x-2 text-sm"
            >
              <span>{currentSortLabel}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div 
                className="sort-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '12rem',
                  backgroundColor: document.documentElement.classList.contains('dark') ? '#000000' : '#FFFFFF',
                  border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  minWidth: '200px',
                  padding: '0.25rem 0',
                  zIndex: 999999
                }}
              >
                {sortOptions.length > 0 ? (
                  sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                        sortBy === option.value 
                          ? 'bg-red-500' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleOptionSelect(option.value)}
                      style={{ 
                        cursor: 'pointer',
                        color: document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000',
                        fontWeight: '500'
                      }}
                    >
                      {option.label}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm dark:text-gray-400 text-gray-600">
                    No options available
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="youtube-button p-2"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowsUpDownIcon className={`w-4 h-4 ${sortOrder === 'asc' ? '' : 'rotate-180'}`} />
          </button>
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}