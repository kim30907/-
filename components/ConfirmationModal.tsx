
import React from 'react';
import { CheckCircleIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full transform transition-all animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mb-5">
            <CheckCircleIcon />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">요청 완료!</h3>
        <p className="text-slate-600 mb-8">
          소모품 요청이 성공적으로 제출되었습니다.
        </p>
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 transition-colors duration-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
