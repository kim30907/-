import React, { useState, useMemo } from 'react';
import type { RequestLog } from '../types';
import { ListIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { getWeekInfo, getWeekRangeString } from '../utils/dateUtils';


interface RequestHistoryProps {
  logs: RequestLog[];
}

interface LogByLine {
    [key: string]: RequestLog[];
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeWeek = (weeks: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + (weeks * 7));
        return newDate;
    });
  };

  const { startOfWeek, endOfWeek } = getWeekInfo(currentDate);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startOfWeek && logDate <= endOfWeek;
    }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, startOfWeek, endOfWeek]);

  const logsByLine = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
        (acc[log.line] = acc[log.line] || []).push(log);
        return acc;
    }, {} as LogByLine);
  }, [filteredLogs]);

  const sortedLines = useMemo(() => Object.keys(logsByLine).sort(), [logsByLine]);

  const renderLogList = () => {
    if (logs.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p>아직 제출된 요청이 없습니다.</p>
        </div>
      );
    }

    if (filteredLogs.length === 0) {
       return (
        <div className="flex items-center justify-center h-48 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p>해당 주차의 요청 내역이 없습니다.</p>
        </div>
      );
    }

    return (
        <div className="space-y-8">
            {sortedLines.map(line => {
                const totalLineCost = logsByLine[line].reduce((sum, log) => sum + log.total_cost, 0);
                return (
                    <div key={line} className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-end mb-3 px-1">
                            <h3 className="font-bold text-lg text-slate-800">{line}</h3>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                {totalLineCost.toLocaleString()}원
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {logsByLine[line].map(log => (
                                <li key={log.id} className="p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-100 shadow-sm transition-colors group">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-700 truncate group-hover:text-slate-900">{log.item_name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {log.quantity}개 &middot; 개당 {(log.total_cost / log.quantity).toLocaleString()}원
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="font-bold text-slate-700">{log.total_cost.toLocaleString()}원</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {new Date(log.timestamp).toLocaleDateString('ko-KR', {month: 'numeric', day: 'numeric'})}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            })}
        </div>
    )
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-100 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-100 rounded-lg">
            <ListIcon className="w-5 h-5 text-slate-600"/>
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">주간 요청 현황</h2>
      </div>

       <div className="mb-6 p-1.5 bg-slate-100/70 rounded-xl flex items-center justify-between border border-slate-200/50">
            <button onClick={() => changeWeek(-1)} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all">
                <ChevronLeftIcon />
            </button>
            <div className="text-center px-2">
                <p className="font-bold text-sm text-slate-700">{getWeekRangeString(currentDate)}</p>
            </div>
            <button onClick={() => changeWeek(1)} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all">
                <ChevronRightIcon />
            </button>
       </div>
      
      <div className="flex-grow overflow-y-auto pr-1">
        {renderLogList()}
      </div>
    </div>
  );
};

export default RequestHistory;