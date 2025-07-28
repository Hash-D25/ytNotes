import React, { useRef, useEffect, useState } from 'react';
import { MagnifyingGlassIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

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
      default:
        return [];
    }
  };

  const handleOptionSelect = (value) => {
    setSortBy(value);
    setIsDropdownOpen(false);
  };

  const currentSortLabel = getSortOptions().find(opt => opt.value === sortBy)?.label || 'Sort By';

  return (
    <header className="youtube-header sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-700">
      <div className="flex items-center justify-between">
        {/* Left Section - Page Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white hidden sm:block">
            {currentPage === 'home' && 'Dashboard'}
            {currentPage === 'favorites' && 'Favorites'}
            {currentPage === 'notes' && 'All Notes'}
            {currentPage === 'video' && 'Video Notes'}
          </h1>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
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
          {/* Sort Dropdown */}
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
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50">
                {getSortOptions().map((option) => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                      sortBy === option.value 
                        ? 'bg-red-500 text-white' 
                        : 'text-white hover:bg-gray-700'
                    }`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
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
        </div>
      </div>
    </header>
  );
}