
import React, { useState } from 'react';
import { ServerIcon, XIcon } from './Icons';

interface EquipmentCodeManagerProps {
  codes: string[];
  onAddCode: (code: string) => string | null;
  onDeleteCode: (code: string) => void;
}

const EquipmentCodeManager: React.FC<EquipmentCodeManagerProps> = ({ codes, onAddCode, onDeleteCode }) => {
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    if (!newCode.trim()) {
      setError('설비코드를 입력해주세요.');
      return;
    }
    const errorMsg = onAddCode(newCode.trim());
    if (errorMsg) {
      setError(errorMsg);
    } else {
      setNewCode('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <ServerIcon />
        <h2 className="text-xl font-bold text-slate-700">설비코드 관리</h2>
      </div>
      <div className="space-y-3">
        <div>
          <label htmlFor="new-code" className="block text-sm font-medium text-slate-600 mb-1">새 설비코드 추가</label>
          <div className="flex gap-2">
            <input
              type="text"
              id="new-code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: EQ-01"
              className="flex-grow p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleAdd}
              className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors duration-300 disabled:bg-slate-300"
              disabled={!newCode.trim()}
            >
              추가
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">현재 설비코드 목록</h3>
            {codes.length > 0 ? (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {codes.map(code => (
                        <li key={code} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                            <span className="text-slate-800">{code}</span>
                            <button onClick={() => onDeleteCode(code)} title={`${code} 삭제`}>
                                <XIcon className="w-5 h-5 text-slate-400 hover:text-red-500 transition-colors" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-slate-500 text-sm">추가된 설비코드가 없습니다.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentCodeManager;
