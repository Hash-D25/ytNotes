import React, { useRef, useEffect, useState } from 'react';
import { MagnifyingGlassIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

export default function Header({ search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder, currentPage = 'home' }) {
  const searchInputRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        searchInputRef.current?.focus();
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

  const getSortOptions = () => {
    console.log('🔧 Getting sort options for page:', currentPage);
    
    switch (currentPage) {
      case 'home':
      case 'favorites':
        const homeOptions = [
          { value: 'createdAt', label: 'Newest' },
          { value: 'title', label: 'Title' },
          { value: 'favorite', label: 'Favorites' }
        ];
        console.log('Home/Favorites options:', homeOptions);
        return homeOptions;
      case 'notes':
        const notesOptions = [
          { value: 'createdAt', label: 'Newest' },
          { value: 'timestamp', label: 'By Timestamp' },
          { value: 'title', label: 'By Video Title' }
        ];
        console.log('Notes options:', notesOptions);
        return notesOptions;
      case 'video':
        const videoOptions = [
          { value: 'createdAt', label: 'Newest' },
          { value: 'timestamp', label: 'By Timestamp' }
        ];
        console.log('Video options:', videoOptions);
        return videoOptions;
      case 'drive':
        const driveOptions = [
          { value: 'createdAt', label: 'Newest' },
          { value: 'title', label: 'Title' }
        ];
        console.log('Drive options:', driveOptions);
        return driveOptions;
      default:
        const defaultOptions = [
          { value: 'createdAt', label: 'Newest' },
          { value: 'title', label: 'Title' }
        ];
        console.log('Default options:', defaultOptions);
        return defaultOptions;
    }
  };

  const handleOptionSelect = (value) => {
    console.log('🔧 Selecting option:', value);
    setSortBy(value);
    setIsDropdownOpen(false);
  };

  const currentSortLabel = getSortOptions().find(opt => opt.value === sortBy)?.label || 'Sort By';
  const sortOptions = getSortOptions();

  console.log('🔧 Current page:', currentPage);
  console.log('🔧 Current sort by:', sortBy);
  console.log('🔧 Sort options:', sortOptions);
  console.log('🔧 Dropdown open:', isDropdownOpen);

  return (
    <header className="top-0 px-4 sm:px-6 lg:px-8 py-4 absolute youtube-header" style={{ zIndex: 999999, backgroundColor: '#151515', left: 0, right: 0 }}>
      <div className="flex items-center justify-between">
        {/* Left Section - Page Title */}
        <div className="flex items-center space-x-4 lg:ml-28">
          <h1 className="text-xl font-semibold dark:text-white text-gray-900 hidden sm:block">
            {currentPage === 'home' && 'Dashboard'}
            {currentPage === 'favorites' && 'Favorites'}
            {currentPage === 'notes' && 'All Notes'}
            {currentPage === 'video' && 'Video Notes'}
          </h1>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-4 lg:ml-8">
          <div className="relative">
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
        </div>

        {/* Right Section - Sort Controls */}
        <div className="flex items-center space-x-3">
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
                className="absolute right-0 mt-2 w-48 dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200 rounded-lg shadow-xl py-1"
                style={{
                  zIndex: 999999,
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                  border: '1px solid var(--tw-border-opacity, 1)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  minWidth: '200px'
                }}
              >
                {sortOptions.length > 0 ? (
                  sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                        sortBy === option.value 
                          ? 'bg-red-500 text-white' 
                          : 'dark:text-white text-gray-900 dark:hover:bg-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => handleOptionSelect(option.value)}
                      style={{ cursor: 'pointer' }}
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