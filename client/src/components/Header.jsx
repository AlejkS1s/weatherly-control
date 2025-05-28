import React from 'react';
import { MenuIcon, ClockIcon } from './icons';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <MenuIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Weatherly Control</h1>
              <p className="text-blue-100 text-sm">Environmental Data Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">System Online</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-blue-700 px-3 py-2 rounded-lg">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;