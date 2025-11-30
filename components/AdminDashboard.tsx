
import React, { useState, useMemo, useCallback } from 'react';
import type { RequestLog, ConsumableItem } from '../types';
import TrendAnalysis from './TrendAnalysis';
import AddItemForm from './AddItemForm';
import LineManager from './LineManager';
import EquipmentCodeManager from './EquipmentCodeManager';
import PasswordManager from './PasswordManager';
import MasterDataManager from './MasterDataManager';
import { ClipboardListIcon, TrendingUpIcon, SettingsIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ListIcon } from './Icons';
import { getWeekInfo, getWeekRangeString } from '../utils/dateUtils';


interface AdminDashboardProps {
  logs: RequestLog[];
  items: ConsumableItem[];
  lines: string[];
  equipmentCodes: string[];
  onAddItem: (item: ConsumableItem) => string | null;
  onAddLine: (line: string) => string | null;
  onDeleteLine: (line: string) => void;
  onAddEquipmentCode: (code: string) => string | null;
  onDeleteEquipmentCode: (code: string) => void;
  onDeleteLog: (logId: string) => void;
  onUpdateLogQuantity: (logId: string, newQuantity: number) => void;
  onPasswordChange: (oldPass: string, newPass: string) => string | null;
  onMasterFileUpdate: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileUploadError: string | null;
  lastMasterUpdate: Date | null;
}

type AggregatedItem = {
  item: ConsumableItem;
  desired_delivery_date?: string;
  totalQuantity: number;
  totalCost: number;
  requestsByLine: { line: string; quantity: number }[];
  requestsByEquipment: { code: string; quantity: number }[];
};

type AdminTab = 'aggregation' | 'trends' | 'settings' | 'history';


const aggregateLogs = (logs: RequestLog[], masterItems: ConsumableItem[]): AggregatedItem[] => {
    const map = new Map<string, AggregatedItem>();
    logs.forEach(log => {
      const key = `${log.item_id}_${log.desired_delivery_date || 'none'}`;
      let entry = map.get(key);
      if (!entry) {
        const item = masterItems.find(i => i.id === log.item_id);
        if (item) {
          entry = {
            item: item,
            desired_delivery_date: log.desired_delivery_date,
            totalQuantity: 0,
            totalCost: 0,
            requestsByLine: [],
            requestsByEquipment: []
          };
          map.set(key, entry);
        } else {
            return; 
        }
      }
      entry.totalQuantity += log.quantity;
      entry.totalCost += log.total_cost;
      
      const lineRequest = entry.requestsByLine.find(r => r.line === log.line);
      if(lineRequest) {
          lineRequest.quantity += log.quantity;
      } else {
          entry.requestsByLine.push({ line: log.line, quantity: log.quantity });
      }

      if (log.equipment_code) {
        const eqRequest = entry.requestsByEquipment.find(r => r.code === log.equipment_code);
        if(eqRequest) {
            eqRequest.quantity += log.quantity;
        } else {
            entry.requestsByEquipment.push({ code: log.equipment_code, quantity: log.quantity });
        }
      }
    });
    return Array.from(map.values()).sort((a,b) => {
        const nameCompare = a.item.name.localeCompare(b.item.name);
        if (nameCompare !== 0) return nameCompare;
        
        if (a.desired_delivery_date && b.desired_delivery_date) {
            return a.desired_delivery_date.localeCompare(b.desired_delivery_date);
        } else if (a.desired_delivery_date) {
            return -1;
        } else if (b.desired_delivery_date) {
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
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const changeWeek = (weeks: number) => setCurrentWeekDate(d => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + (weeks * 7));
      return newDate;
  });
  
  const changeMonth = (months: number) => setCurrentMonthDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + months, 1); 
      return newDate;
  });

  const sortedLogs = useMemo(() => {
    return [...props.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

  const handleDeleteInitiate = (logId: string) => {
    setLogToDelete(logId);
  };

  const handleDeleteConfirm = () => {
    if (logToDelete) {
        props.onDeleteLog(logToDelete);
        setLogToDelete(null);
        // If the deleted log was being edited, exit edit mode
        if (editingLogId === logToDelete) {
            handleCancelEdit();
        }
    }
  };

  const handleDeleteCancel = () => {
    setLogToDelete(null);
  };

  const renderDesiredDate = useCallback((dateString?: string) => {
    if (!dateString) {
        return <span className="text-slate-400 text-xs">미지정</span>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parts = dateString.split('-').map(p => parseInt(p, 10));
    const desiredDate = new Date(parts[0], parts[1] - 1, parts[2]);

    const diffTime = desiredDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let diffText = '';
    let badgeClass = 'bg-slate-100 text-slate-600';

    if (diffDays > 0) {
        diffText = `D-${diffDays}`;
        if (diffDays <= 3) {
            badgeClass = 'bg-orange-100 text-orange-700 font-bold';
        } else {
            badgeClass = 'bg-green-100 text-green-700';
        }
    } else if (diffDays === 0) {
        diffText = '오늘';
        badgeClass = 'bg-red-100 text-red-700 font-bold';
    } else {
        diffText = `D+${Math.abs(diffDays)}`;
        badgeClass = 'bg-slate-200 text-slate-500';
    }

    return (
        <div className="flex flex-col items-start gap-1">
            <span className="text-slate-800 text-sm font-medium">{dateString}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${badgeClass}`}>{diffText}</span>
        </div>
    );
  }, []);

  const { startOfWeek, endOfWeek } = getWeekInfo(currentWeekDate);
  const weeklyLogs = useMemo(() => props.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startOfWeek && logDate <= endOfWeek;
  }), [props.logs, startOfWeek, endOfWeek]);
  const weeklyAggregatedData = useMemo(() => aggregateLogs(weeklyLogs, props.items), [weeklyLogs, props.items]);

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

    const headers = ['품번', '업체명', '품명', '규격', '단위', '단가', '희망 납기일', '총 필요수량', '총 금액', '요청 라인별 수량', '설비코드별 수량'];
    const rows = dataToDownload.map(({item, desired_delivery_date, totalQuantity, totalCost, requestsByLine, requestsByEquipment}) => [
        item.id,
        `"${item.supplier.replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.specification.replace(/"/g, '""')}"`,
        `"${item.unit.replace(/"/g, '""')}"`,
        item.price,
        desired_delivery_date || '',
        totalQuantity,
        totalCost,
        `"${requestsByLine.map(r => `${r.line}(${r.quantity})`).join('; ')}"`,
        `"${requestsByEquipment.map(r => `${r.code}(${r.quantity})`).join('; ')}"`
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
        return <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">해당 기간에 집계할 데이터가 없습니다.</div>;
    }
    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left bg-white">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">품목명 / SKU</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">납기일</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">단가</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">수량</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">총 금액</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">라인별</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">설비별</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {data.map(({ item, desired_delivery_date, totalQuantity, totalCost, requestsByLine, requestsByEquipment }) => (
                    <tr key={`${item.id}-${desired_delivery_date || 'none'}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.id}</div>
                    </td>
                    <td className="p-4">{renderDesiredDate(desired_delivery_date)}</td>
                    <td className="p-4 text-right text-slate-600 font-medium">{item.price.toLocaleString()}</td>
                    <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-50 text-blue-700">
                            {totalQuantity}
                        </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">{totalCost.toLocaleString()}원</td>
                    <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                            {requestsByLine.map(r => (
                                <span key={r.line} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                    {r.line} <b className="text-slate-800">({r.quantity})</b>
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className="p-4">
                         <div className="flex flex-wrap gap-1">
                            {requestsByEquipment.length > 0 ? requestsByEquipment.map(r => (
                                <span key={r.code} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                    {r.code} <b className="text-slate-800">({r.quantity})</b>
                                </span>
                            )) : <span className="text-slate-300">-</span>}
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
  };

  const renderAggregation = () => (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-100 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">요청 품목 집계</h2>
        <div className="flex p-1 bg-slate-100 rounded-lg">
            <button onClick={() => setAggregationView('weekly')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all shadow-sm ${aggregationView === 'weekly' ? 'bg-white text-blue-600' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}>주간</button>
            <button onClick={() => setAggregationView('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all shadow-sm ${aggregationView === 'monthly' ? 'bg-white text-green-600' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}>월간</button>
        </div>
      </div>
      
      {aggregationView === 'weekly' && (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                         <CalendarIcon />
                    </div>
                    <span className="font-bold text-lg text-slate-700">{getWeekRangeString(currentWeekDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeWeek(-1)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"><ChevronLeftIcon /></button>
                    <button onClick={() => changeWeek(1)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"><ChevronRightIcon /></button>
                    <div className="w-px h-6 bg-slate-300 mx-2"></div>
                    <button onClick={() => handleDownload()} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-shadow shadow-md shadow-blue-200 text-sm">
                        <DownloadIcon /> 엑셀 다운로드
                    </button>
                </div>
            </div>
            {renderAggregationTable(weeklyAggregatedData)}
        </div>
      )}

      {aggregationView === 'monthly' && (
         <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                        <CalendarIcon />
                    </div>
                    <span className="font-bold text-lg text-slate-700">{`${currentMonthDate.getFullYear()}년 ${currentMonthDate.getMonth() + 1}월`}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"><ChevronLeftIcon /></button>
                    <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"><ChevronRightIcon /></button>
                    <div className="w-px h-6 bg-slate-300 mx-2"></div>
                    <button onClick={() => handleDownload()} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-shadow shadow-md shadow-green-200 text-sm">
                        <DownloadIcon /> 엑셀 다운로드
                    </button>
                </div>
            </div>
            {renderAggregationTable(monthlyAggregatedData)}
        </div>
      )}
    </div>
  );

  const renderHistoryManagement = () => (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-100 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">요청 기록 관리</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {sortedLogs.length === 0 ? (
           <div className="p-12 text-center text-slate-400">관리할 요청 기록이 없습니다.</div>
        ) : (
            <table className="w-full text-left bg-white">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">요청일시</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">라인 / 설비</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">품목명</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">납기일</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">수량</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">금액</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">작업</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-slate-500 text-sm whitespace-nowrap">{new Date(log.timestamp).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="p-4">
                                <div className="font-medium text-slate-700">{log.line}</div>
                                {log.equipment_code && <div className="text-xs text-slate-400">{log.equipment_code}</div>}
                            </td>
                            <td className="p-4 font-semibold text-slate-800">{log.item_name}</td>
                            <td className="p-4">{renderDesiredDate(log.desired_delivery_date)}</td>
                            <td className="p-4 text-center">
                                {editingLogId === log.id ? (
                                    <input 
                                        type="number" 
                                        value={editingQuantity}
                                        onChange={(e) => setEditingQuantity(parseInt(e.target.value, 10) || 0)}
                                        className="w-16 text-center border-slate-300 border rounded-md p-1 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                        autoFocus
                                        min="1"
                                    />
                                ) : (
                                    <span className="font-bold text-blue-600">{log.quantity}</span>
                                )}
                            </td>
                            <td className="p-4 text-right font-medium text-slate-700">{log.total_cost.toLocaleString()}</td>
                            <td className="p-4 text-center">
                                {editingLogId === log.id ? (
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleSaveEdit(log.id)} className="text-lg hover:scale-110 transition-transform" title="저장">
                                            ✅
                                        </button>
                                        <button onClick={handleCancelEdit} className="text-lg hover:scale-110 transition-transform" title="취소">
                                            ❌
                                        </button>
                                        <button onClick={() => handleDeleteInitiate(log.id)} className="text-lg hover:scale-110 transition-transform ml-2" title="삭제">
                                            🗑️
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-center items-center">
                                        <button 
                                            onClick={() => handleEditClick(log)} 
                                            className="text-lg text-slate-400 hover:text-blue-600 hover:scale-110 transition-all p-1"
                                            title="수량 수정"
                                        >
                                            ✏️
                                        </button>
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
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">시스템 설정</h2>
            <p className="mt-1 text-slate-500 text-sm">
                소모품 데이터베이스, 라인 및 설비 목록, 보안 설정을 관리합니다.
            </p>
        </div>
        <MasterDataManager 
            onUpload={props.onMasterFileUpdate} 
            error={props.fileUploadError}
            itemCount={props.items.length}
            lastMasterUpdate={props.lastMasterUpdate}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <AddItemForm onAddItem={props.onAddItem} />
                <PasswordManager onSave={props.onPasswordChange} />
            </div>
            <div className="space-y-6">
                <LineManager 
                    lines={props.lines}
                    onAddLine={props.onAddLine}
                    onDeleteLine={props.onDeleteLine}
                />
                <EquipmentCodeManager
                    codes={props.equipmentCodes}
                    onAddCode={props.onAddEquipmentCode}
                    onDeleteCode={props.onDeleteEquipmentCode}
                />
            </div>
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
        className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex-1 md:flex-none ${
            isActive
                ? 'text-blue-700 bg-white shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
        }`}
    >
        {icon}
        {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <div className="bg-slate-100/70 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200/50">
            <TabButton label="요청 집계" icon={<ClipboardListIcon className="w-4 h-4"/>} isActive={activeTab === 'aggregation'} onClick={() => setActiveTab('aggregation')} />
            <TabButton label="기록 관리" icon={<ListIcon className="w-4 h-4"/>} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <TabButton label="트렌드 분석" icon={<TrendingUpIcon className="w-4 h-4"/>} isActive={activeTab === 'trends'} onClick={() => setActiveTab('trends')} />
            <TabButton label="설정" icon={<SettingsIcon className="w-4 h-4"/>} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>

      {logToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleDeleteCancel}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-2">기록 삭제 확인</h3>
                <p className="text-slate-600 mb-6">
                    선택한 요청 기록을 삭제하시겠습니까?<br/>
                    <span className="text-sm text-red-500">이 작업은 되돌릴 수 없습니다.</span>
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={handleDeleteCancel} 
                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleDeleteConfirm} 
                        className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
