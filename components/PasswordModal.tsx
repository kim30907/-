import React, { useState, useEffect } from 'react';
import { LockIcon } from './Icons';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => boolean;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onSubmit(password);
    if (!success) {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full transform transition-all animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto bg-slate-100 rounded-full h-16 w-16 flex items-center justify-center mb-5">
            <LockIcon className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">관리자 모드 접속</h3>
        <p className="text-slate-600 mb-6">
          계속하려면 관리자 비밀번호를 입력하세요.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="비밀번호 입력"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            확인
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors duration-300"
          >
            취소
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;