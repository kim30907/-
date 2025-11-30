import React from 'react';
import { BoxIcon } from './Icons';

interface HeaderProps {
    userMode: 'general' | 'admin';
    onModeChange: (mode: 'general' | 'admin') => void;
}

const Header: React.FC<HeaderProps> = ({ userMode, onModeChange }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <BoxIcon />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                YSP 남동공장 소모품관리
                </h1>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-full border border-slate-200/50">
                <button
                    onClick={() => onModeChange('general')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        userMode === 'general' 
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    일반 모드
                </button>
                <button
                    onClick={() => onModeChange('admin')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        userMode === 'admin' 
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    관리자
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;