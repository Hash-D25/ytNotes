import React from 'react';
import { BookOpenIcon, HomeIcon, HeartIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { name: 'Dashboard', icon: <HomeIcon className="w-6 h-6" />, href: '/' },
  { name: 'All Notes', icon: <BookOpenIcon className="w-6 h-6" />, href: '/notes' },
  { name: 'Favorites', icon: <HeartIcon className="w-6 h-6" />, href: '/favorites' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar fixed top-0 left-0 h-153 w-16 bg-white shadow-lg flex flex-col items-center py-6 z-50 rounded-r-3xl border-r border-gray-200 mt-2 ">
      <div className="mb-8">
        <div className="bg-primary rounded-4xl p-2 shadow-md">
          <img src="icon.png" alt="logo" className="w-9 h-9" />
        </div>
      </div>
      <nav className="flex flex-col gap-6 flex-1">
        {NAV_LINKS.map(link => (
          <Link key={link.name} to={link.href} className="group flex flex-col items-center text-gray-400 hover:text-primary transition-colors">
            <span className="sidebar-icon flex items-center justify-center w-10 h-10 rounded-xl group-hover:bg-primary/10">
              {link.icon}
            </span>
            <span className="text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium tracking-wide">{link.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
