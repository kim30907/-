import React from 'react';
import { BoxIcon } from './Icons';

interface HeaderProps {
    userMode: 'general' | 'admin';
    onModeChange: (mode: 'general' | 'admin') => void;
}

const Header: React.FC<HeaderProps> = ({ userMode, onModeChange }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <BoxIcon />
                <h1 className="text-2xl font-bold text-slate-800">
                소모품 통합 관리
                </h1>
            </div>

            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-full">
                <button
                    onClick={() => onModeChange('general')}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                        userMode === 'general' ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    일반 모드
                </button>
                <button
                    onClick={() => onModeChange('admin')}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                        userMode === 'admin' ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    관리자 모드
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
