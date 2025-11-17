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
    }).sort((a,b) => b.timestamp - a.timestamp);
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
        <div className="flex items-center justify-center h-full text-center text-slate-500 bg-slate-50 rounded-lg">
          <p>아직 제출된 요청이 없습니다.</p>
        </div>
      );
    }

    if (filteredLogs.length === 0) {
       return (
        <div className="flex items-center justify-center h-full text-center text-slate-500 bg-slate-50 rounded-lg p-4">
          <p>해당 주차의 요청 내역이 없습니다.</p>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            {sortedLines.map(line => {
                const totalLineCost = logsByLine[line].reduce((sum, log) => sum + log.totalCost, 0);
                return (
                    <div key={line}>
                        <h3 className="flex justify-between items-baseline font-bold text-lg text-slate-700 pb-2 mb-2 border-b-2 border-slate-200">
                            <span>{line}</span>
                            <span className="text-base font-semibold text-blue-600">
                                총액: {totalLineCost.toLocaleString()}원
                            </span>
                        </h3>
                        <ul className="space-y-3">
                            {logsByLine[line].map(log => (
                                <li key={log.id} className="p-3 hover:bg-slate-50 rounded-md transition-colors">
                                    <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-slate-800">{log.itemName}</p>
                                        <p className="text-sm text-slate-500">
                                            단가: {(log.totalCost / log.quantity).toLocaleString()}원 &middot; 수량: {log.quantity}개
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-semibold text-slate-800">{log.totalCost.toLocaleString()}원</p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(log.timestamp).toLocaleDateString('ko-KR')}
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
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
            <ListIcon />
            <h2 className="text-xl font-bold text-slate-700">주차별 라인 요청 현황</h2>
        </div>
      </div>

       <div className="mb-4 p-2 bg-slate-100 rounded-lg flex items-center justify-between">
            <button onClick={() => changeWeek(-1)} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <ChevronLeftIcon />
            </button>
            <div className="text-center">
                <p className="font-semibold text-slate-700">{getWeekRangeString(currentDate)}</p>
            </div>
            <button onClick={() => changeWeek(1)} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <ChevronRightIcon />
            </button>
       </div>
      
      <div className="flex-grow overflow-y-auto min-h-[100px] -mr-2 pr-2">
        {renderLogList()}
      </div>
    </div>
  );
};

export default RequestHistory;