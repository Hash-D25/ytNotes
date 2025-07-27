import React, { useRef, useEffect, useState } from 'react';
import { MagnifyingGlassIcon, UserIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

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
    <nav className="top-0 left-16 w-[calc(100%-4rem)] z-40 flex items-center justify-between px-8 py-3 rounded-b-2xl  backdrop-blur-sm">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <span className="font-extrabold tracking-tight">Dashboard</span>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-xl flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search videos... (Press / to focus)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-5 pr-12 py-2 rounded-full border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors">
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 ml-4" ref={dropdownRef}>
          {/* Custom Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-4 py-2 pr-10 rounded-full border border-gray-300 bg-white text-gray-800 font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all duration-200 hover:border-gray-400 min-w-[100px]"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {currentSortLabel}
              <svg
                className={`ml-2 w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg bg-white shadow-lg py-1 border border-gray-200 max-h-60 overflow-auto">
                {getSortOptions().map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2 cursor-pointer transition-colors duration-150 ${
                      sortBy === option.value 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowsUpDownIcon className={`w-5 h-5 ${sortOrder === 'asc' ? 'text-gray-600' : 'text-gray-600 transform rotate-180'}`} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-6 mr-0">
        <div className="rounded-full border border-gray-200 shadow-sm p-1 bg-white hover:bg-gray-50 transition-colors duration-200">
          <img src="profileIcons/pink.png" alt="User profile" className="w-7 h-7" />
        </div>
      </div>
    </nav>
  );
}