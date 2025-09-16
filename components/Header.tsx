/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparklesIcon } from './icons';

interface HeaderProps {
  onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="w-full py-4 px-8 border-b border-gray-700 bg-gray-800/30 backdrop-blur-sm sticky top-0 z-50">
      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-3 cursor-pointer bg-transparent border-none p-0"
        aria-label="Edit Photo homepage - reset"
      >
          <SparklesIcon className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight text-gray-100">
            Edit Photo
          </h1>
      </button>
    </header>
  );
};

export default Header;