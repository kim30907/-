import React, { useState, useMemo, useCallback } from 'react';
import type { RequestLog, ConsumableItem } from '../types';
import TrendAnalysis from './TrendAnalysis';
import AddItemForm from './AddItemForm';
import LineManager from './LineManager';
import PasswordManager from './PasswordManager';
import MasterDataManager from './MasterDataManager';
import { ClipboardListIcon, TrendingUpIcon, SettingsIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ListIcon } from './Icons';
import { getWeekInfo, getWeekRangeString } from '../utils/dateUtils';


interface AdminDashboardProps {
  logs: RequestLog[];
  items: ConsumableItem[];
  lines: string[];
  onAddItem: (item: ConsumableItem) => string | null;
  onAddLine: (line: string) => string | null;
  onDeleteLine: (line: string) => void;
  onDeleteLog: (logId: string) => void;
  onUpdateLogQuantity: (logId: string, newQuantity: number) => void;
  onPasswordChange: (oldPass: string, newPass: string) => string | null;
  onMasterFileUpdate: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileUploadError: string | null;
  lastMasterUpdate: Date | null;
}

type AggregatedItem = {
  item: ConsumableItem;
  desiredDeliveryDate?: string;
  totalQuantity: number;
  totalCost: number;
  requestsByLine: { line: string; quantity: number }[];
};

type AdminTab = 'aggregation' | 'trends' | 'settings' | 'history';


const aggregateLogs = (logs: RequestLog[], masterItems: ConsumableItem[]): AggregatedItem[] => {
    const map = new Map<string, AggregatedItem>();
    logs.forEach(log => {
      const key = `${log.itemId}_${log.desiredDeliveryDate || 'none'}`;
      let entry = map.get(key);
      if (!entry) {
        const item = masterItems.find(i => i.id === log.itemId);
        if (item) {
          entry = {
            item: item,
            desiredDeliveryDate: log.desiredDeliveryDate,
            totalQuantity: 0,
            totalCost: 0,
            requestsByLine: []
          };
          map.set(key, entry);
        } else {
            return; // Skip if master item not found
        }
      }
      entry.totalQuantity += log.quantity;
      entry.totalCost += log.totalCost;
      
      const lineRequest = entry.requestsByLine.find(r => r.line === log.line);
      if(lineRequest) {
          lineRequest.quantity += log.quantity;
      } else {
          entry.requestsByLine.push({ line: log.line, quantity: log.quantity });
      }
    });
    return Array.from(map.values()).sort((a,b) => {
        const nameCompare = a.item.name.localeCompare(b.item.name);
        if (nameCompare !== 0) return nameCompare;
        
        if (a.desiredDeliveryDate && b.desiredDeliveryDate) {
            return a.desiredDeliveryDate.localeCompare(b.desiredDeliveryDate);
        } else if (a.desiredDeliveryDate) {
            return -1;
        } else if (b.desiredDeliveryDate) {
            return 1;
        }
        return 0;
    });
};


const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('aggregation');
  const [aggregationView, setAggregationView] = useState<'weekly' | 'monthly'>('weekly');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);

  // Date states for navigation
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const changeWeek = (weeks: number) => setCurrentWeekDate(d => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + (weeks * 7));
      return newDate;
  });
  
  const changeMonth = (months: number) => setCurrentMonthDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + months, 1); // Set to day 1 to avoid month-end issues
      return newDate;
  });

  const sortedLogs = useMemo(() => {
    return [...props.logs].sort((a, b) => b.timestamp - a.timestamp);
  }, [props.logs]);

  const handleEditClick = (log: RequestLog) => {
    setEditingLogId(log.id);
    setEditingQuantity(log.quantity);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditingQuantity(0);
  };

  const handleSaveEdit = (logId: string) => {
    if (editingQuantity > 0) {
      props.onUpdateLogQuantity(logId, editingQuantity);
      handleCancelEdit();
    }
  };

  const handleDeleteClick = (logId: string, itemName: string) => {
    if (window.confirm(`'${itemName}' 요청을 정말로 삭제하시겠습니까?`)) {
        props.onDeleteLog(logId);
    }
  }

  const renderDesiredDate = useCallback((dateString?: string) => {
    if (!dateString) {
        return <span className="text-slate-400">지정 안함</span>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create Date object from 'YYYY-MM-DD' string safely, avoiding timezone issues.
    const parts = dateString.split('-').map(p => parseInt(p, 10));
    const desiredDate = new Date(parts[0], parts[1] - 1, parts[2]);

    const diffTime = desiredDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let diffText = '';
    let textColor = 'text-slate-600';

    if (diffDays > 0) {
        diffText = ` (D-${diffDays})`;
        if (diffDays <= 3) {
            textColor = 'text-orange-600 font-bold';
        } else {
            textColor = 'text-green-700';
        }
    } else if (diffDays === 0) {
        diffText = ' (오늘)';
        textColor = 'text-red-600 font-bold';
    } else {
        diffText = ` (D+${Math.abs(diffDays)}, 지남)`;
        textColor = 'text-slate-500';
    }

    return (
        <div className="whitespace-nowrap">
            <span className="text-slate-700">{dateString}</span>
            <span className={`ml-1 ${textColor}`}>{diffText}</span>
        </div>
    );
  }, []);


  // Memoized data for weekly view
  const { startOfWeek, endOfWeek } = getWeekInfo(currentWeekDate);
  const weeklyLogs = useMemo(() => props.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startOfWeek && logDate <= endOfWeek;
  }), [props.logs, startOfWeek, endOfWeek]);
  const weeklyAggregatedData = useMemo(() => aggregateLogs(weeklyLogs, props.items), [weeklyLogs, props.items]);

  // Memoized data for monthly view
  const startOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
  const endOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthlyLogs = useMemo(() => props.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startOfMonth && logDate <= endOfMonth;
  }), [props.logs, startOfMonth, endOfMonth]);
  const monthlyAggregatedData = useMemo(() => aggregateLogs(monthlyLogs, props.items), [monthlyLogs, props.items]);

  const handleDownload = () => {
    const isWeekly = aggregationView === 'weekly';
    const dataToDownload = isWeekly ? weeklyAggregatedData : monthlyAggregatedData;
    if (dataToDownload.length === 0) return;

    const headers = ['품번', '업체명', '품명', '규격', '단위', '단가', '희망 납기일', '총 필요수량', '총 금액', '요청 라인별 수량'];
    const rows = dataToDownload.map(({item, desiredDeliveryDate, totalQuantity, totalCost, requestsByLine}) => [
        item.id,
        `"${item.supplier.replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.specification.replace(/"/g, '""')}"`,
        `"${item.unit.replace(/"/g, '""')}"`,
        item.price,
        desiredDeliveryDate || '',
        totalQuantity,
        totalCost,
        `"${requestsByLine.map(r => `${r.line}(${r.quantity})`).join('; ')}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const period = isWeekly 
        ? `${startOfWeek.getFullYear()}-${getWeekRangeString(currentWeekDate)}`
        : `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}월`;
    link.setAttribute('href', url);
    link.setAttribute('download', `consumables_aggregation_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderAggregationTable = (data: AggregatedItem[]) => {
    if (data.length === 0) {
        return <p className="text-slate-500 text-center py-10">해당 기간에 집계할 요청 데이터가 없습니다.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                    <th className="p-4 text-sm font-semibold text-slate-600">품목명</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">SKU</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">희망 납기일</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 text-right">단가</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 text-center">총 필요수량</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 text-right">총 금액</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">요청 라인별 수량</th>
                </tr>
                </thead>
                <tbody>
                {data.map(({ item, desiredDeliveryDate, totalQuantity, totalCost, requestsByLine }) => (
                    <tr key={`${item.id}-${desiredDeliveryDate || 'none'}`} className="border-b border-slate-100">
                    <td className="p-4 font-medium text-slate-800">{item.name}</td>
                    <td className="p-4 text-slate-500">{item.id}</td>
                    <td className="p-4 text-sm">{renderDesiredDate(desiredDeliveryDate)}</td>
                    <td className="p-4 text-right text-slate-600">{item.price.toLocaleString()}원</td>
                    <td className="p-4 text-center font-bold text-lg text-blue-600">{totalQuantity}</td>
                    <td className="p-4 text-right font-semibold text-slate-800">{totalCost.toLocaleString()}원</td>
                    <td className="p-4 text-slate-600 text-sm">
                        {requestsByLine.map(r => `${r.line} (${r.quantity}개)`).join(', ')}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
  };

  const renderAggregation = () => (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-800">요청 품목 집계</h2>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
            <button onClick={() => setAggregationView('weekly')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${aggregationView === 'weekly' ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}>주차별 집계</button>
            <button onClick={() => setAggregationView('monthly')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${aggregationView === 'monthly' ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}>월별 통합</button>
        </div>
      </div>
      
      {aggregationView === 'weekly' && (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-8 h-8 text-blue-600" />
                    <span className="font-bold text-slate-700 whitespace-nowrap">{getWeekRangeString(currentWeekDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeWeek(-1)} className="p-2 rounded-md hover:bg-slate-100 transition-colors"><ChevronLeftIcon /></button>
                    <button onClick={() => changeWeek(1)} className="p-2 rounded-md hover:bg-slate-100 transition-colors"><ChevronRightIcon /></button>
                    <button onClick={() => handleDownload()} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"><DownloadIcon /> 다운로드</button>
                </div>
            </div>
            {renderAggregationTable(weeklyAggregatedData)}
        </div>
      )}

      {aggregationView === 'monthly' && (
         <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-8 h-8 text-green-600" />
                    <span className="font-bold text-slate-700 whitespace-nowrap">{`${currentMonthDate.getFullYear()}년 ${currentMonthDate.getMonth() + 1}월`}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-slate-100 transition-colors"><ChevronLeftIcon /></button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-slate-100 transition-colors"><ChevronRightIcon /></button>
                    <button onClick={() => handleDownload()} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"><DownloadIcon /> 다운로드</button>
                </div>
            </div>
            {renderAggregationTable(monthlyAggregatedData)}
        </div>
      )}
    </div>
  );

  const renderHistoryManagement = () => (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">요청 기록 관리</h2>
      <div className="overflow-x-auto">
        {sortedLogs.length === 0 ? (
           <p className="text-slate-500 text-center py-10">관리할 요청 기록이 없습니다.</p>
        ) : (
            <table className="w-full text-left">
                <thead className="border-b-2 border-slate-200 bg-slate-50">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-slate-600">요청일시</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">라인</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">품목명</th>
                        <th className="p-4 text-sm font-semibold text-slate-600">희망 납기일</th>
                        <th className="p-4 text-sm font-semibold text-slate-600 text-center">수량</th>
                        <th className="p-4 text-sm font-semibold text-slate-600 text-right">금액</th>
                        <th className="p-4 text-sm font-semibold text-slate-600 text-center">작업</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedLogs.map(log => (
                        <tr key={log.id} className="border-b border-slate-100">
                            <td className="p-4 text-slate-500 text-sm whitespace-nowrap">{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                            <td className="p-4 text-slate-600 font-medium">{log.line}</td>
                            <td className="p-4 font-medium text-slate-800">{log.itemName}</td>
                            <td className="p-4 text-sm">{renderDesiredDate(log.desiredDeliveryDate)}</td>
                            <td className="p-4 text-center">
                                {editingLogId === log.id ? (
                                    <input 
                                        type="number" 
                                        value={editingQuantity}
                                        onChange={(e) => setEditingQuantity(parseInt(e.target.value, 10) || 0)}
                                        className="w-16 text-center border-slate-300 border rounded-md p-1 focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                        min="1"
                                    />
                                ) : (
                                    <span className="font-bold text-lg text-blue-600">{log.quantity}</span>
                                )}
                            </td>
                            <td className="p-4 text-right font-semibold text-slate-800">{log.totalCost.toLocaleString()}원</td>
                            <td className="p-4 text-center">
                                {editingLogId === log.id ? (
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleSaveEdit(log.id)} className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors">저장</button>
                                        <button onClick={handleCancelEdit} className="text-sm text-slate-600 hover:bg-slate-100 px-3 py-1 rounded-md transition-colors">취소</button>
                                    </div>
                                ) : (
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleEditClick(log)} className="text-sm font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1 rounded-md transition-colors">수정</button>
                                        <button onClick={() => handleDeleteClick(log.id, log.itemName)} className="text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-1 rounded-md transition-colors">삭제</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">설정</h2>
            <p className="mt-2 text-slate-500">
                애플리케이션의 소모품 목록, 라인, 관리자 비밀번호를 관리합니다.
            </p>
        </div>
        <MasterDataManager 
            onUpload={props.onMasterFileUpdate} 
            error={props.fileUploadError}
            itemCount={props.items.length}
            lastMasterUpdate={props.lastMasterUpdate}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AddItemForm onAddItem={props.onAddItem} />
            <LineManager 
                lines={props.lines}
                onAddLine={props.onAddLine}
                onDeleteLine={props.onDeleteLine}
            />
        </div>
        <div className="lg:max-w-[50%]">
             <PasswordManager onSave={props.onPasswordChange} />
        </div>
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'aggregation': return renderAggregation();
      case 'history': return renderHistoryManagement();
      case 'trends': return <TrendAnalysis logs={props.logs} />;
      case 'settings': return renderSettings();
      default: return null;
    }
  };

  const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon, isActive, onClick }) => (
     <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        {icon}
        {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 flex flex-wrap items-center gap-2">
            <TabButton label="요청 집계" icon={<ClipboardListIcon className="w-5 h-5"/>} isActive={activeTab === 'aggregation'} onClick={() => setActiveTab('aggregation')} />
            <TabButton label="요청 기록 관리" icon={<ListIcon className="w-5 h-5"/>} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <TabButton label="트렌드 분석" icon={<TrendingUpIcon className="w-5 h-5"/>} isActive={activeTab === 'trends'} onClick={() => setActiveTab('trends')} />
            <TabButton label="설정" icon={<SettingsIcon className="w-5 h-5"/>} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;