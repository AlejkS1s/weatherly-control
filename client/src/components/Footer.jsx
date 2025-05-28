import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="text-sm text-gray-300">
              © 2025 Weatherly Control. Environmental monitoring.
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">All systems operational</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Last sync: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>
              Built with React, Node.js, InfluxDB & MQTT
            </div>
            <div className="mt-2 md:mt-0">
              Version 1.0.0 | Support: support@weatherly.com
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;