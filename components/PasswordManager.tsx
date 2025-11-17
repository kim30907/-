import React, { useState } from 'react';
import { LockIcon } from './Icons';

interface PasswordManagerProps {
  onSave: (oldPass: string, newPass: string) => string | null;
}

const PasswordManager: React.FC<PasswordManagerProps> = ({ onSave }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        const errorMsg = onSave(oldPassword, newPassword);
        if (errorMsg) {
            setError(errorMsg);
        } else {
            setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };
    
    const isFormValid = oldPassword && newPassword && confirmPassword;

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <LockIcon />
            <h2 className="text-xl font-bold text-slate-700">비밀번호 변경</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-slate-600 mb-1">현재 비밀번호</label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-600 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95 mt-2"
            >
              비밀번호 변경
            </button>
          </form>
        </div>
    );
};

export default PasswordManager;