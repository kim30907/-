import React from 'react';
import { UploadIcon } from './Icons';

interface MasterDataManagerProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  itemCount: number;
  lastMasterUpdate: Date | null;
}

const MasterDataManager: React.FC<MasterDataManagerProps> = ({ onUpload, error, itemCount, lastMasterUpdate }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                <path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-4"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                <path d="M5 10v1"></path><path d="M5 18v1"></path>
                <path d="M8 12.5v-1"></path>
                <path d="M2 12.5v-1"></path>
                <path d="M8 15.5v-1"></path>
                <path d="M2 15.5v-1"></path>
            </svg>
            <h2 className="text-xl font-bold text-slate-700">소모품 마스터 데이터 관리</h2>
        </div>
      <p className="text-slate-500 mb-4">
        새로운 CSV 파일을 업로드하여 전체 소모품 목록을 업데이트합니다. 기존 데이터는 모두 교체됩니다.
      </p>

       <div className="text-center bg-slate-50 p-4 rounded-lg text-sm text-slate-700 w-full mb-6 border border-slate-200">
            {itemCount > 0 ? (
                <div>
                    <p className="font-semibold">현재 <strong className="text-blue-600 text-base">{itemCount.toLocaleString()}개</strong>의 품목 데이터가 있습니다.</p>
                    {lastMasterUpdate && (
                        <p className="text-xs text-slate-500 mt-1">
                        마지막 업데이트: {lastMasterUpdate.toLocaleString('ko-KR')}
                        </p>
                    )}
                </div>
            ) : (
                <p className="font-semibold text-orange-600">현재 등록된 소모품 데이터가 없습니다. 먼저 마스터 CSV 파일을 업로드해주세요.</p>
            )}
       </div>

      <label className="cursor-pointer bg-slate-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-800 transition-colors duration-300 flex items-center justify-center gap-2">
        <UploadIcon />
        새 마스터 CSV 파일 선택
        <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onUpload}
        />
      </label>
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
       <div className="mt-6 text-left bg-slate-50 p-4 rounded-lg text-sm text-slate-600 w-full border border-slate-200">
            <h4 className="font-bold mb-2">💡 CSV 파일 형식 안내</h4>
            <p className="mb-3">
                Excel에서 파일을 저장할 때 '파일 형식'을 <strong className="text-blue-600">CSV UTF-8 (쉼표로 분리)</strong>로 선택하시면 글자 깨짐 문제를 방지할 수 있습니다.
            </p>
            <h4 className="font-bold mb-2">필수 컬럼 순서:</h4>
            <code>
            품번,업체명,품명,규격,단위,단가
            </code>
        </div>
    </div>
  );
};

export default MasterDataManager;