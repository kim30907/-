
import React, { useMemo } from 'react';
import type { RequestLog } from '../types';

interface TrendAnalysisProps {
  logs: RequestLog[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ logs }) => {

  const analysis = useMemo(() => {
    if (logs.length === 0) {
      return {
        totalRequests: 0,
        totalCost: 0,
        uniqueLines: 0,
        lineSpending: [],
        monthlyTrends: [],
      };
    }

    const totalCost = logs.reduce((sum, log) => sum + log.totalCost, 0);

    const lineSpendingMap = new Map<string, number>();
    logs.forEach(log => {
      lineSpendingMap.set(log.line, (lineSpendingMap.get(log.line) || 0) + log.totalCost);
    });
    const lineSpending = Array.from(lineSpendingMap.entries())
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);
      
    const monthlyData = new Map<string, { cost: number; count: number }>();
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyData.get(monthKey) || { cost: 0, count: 0 };
      current.cost += log.totalCost;
      current.count += 1;
      monthlyData.set(monthKey, current);
    });
    const monthlyTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRequests: logs.length,
      totalCost,
      uniqueLines: lineSpending.length,
      lineSpending,
      monthlyTrends,
    };
  }, [logs]);

  const maxMonthlyCost = useMemo(() => Math.max(...analysis.monthlyTrends.map(t => t.cost), 0), [analysis.monthlyTrends]);

  const SummaryCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );

  if (logs.length === 0) {
    return (
        <div className="text-center bg-white p-10 rounded-xl shadow-md border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">트렌드 분석</h2>
            <p className="text-slate-500">분석할 요청 데이터가 없습니다. 먼저 요청을 제출해주세요.</p>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-800">소모품 요청 트렌드 분석</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="총 요청 건수" value={analysis.totalRequests.toLocaleString()} />
        <SummaryCard title="총 요청 비용" value={`${analysis.totalCost.toLocaleString()}원`} />
        <SummaryCard title="요청 라인 수" value={analysis.uniqueLines.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-700 mb-6">라인별 지출 현황</h3>
            <div className="space-y-4">
                {analysis.lineSpending.map(({ name, cost }) => (
                    <div key={name} className="group">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-700 text-sm">{name}</span>
                            <span className="text-sm font-medium text-slate-600">{cost.toLocaleString()}원</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4">
                            <div 
                                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${(cost / (analysis.lineSpending[0]?.cost || 1)) * 100}%`}}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-700 mb-6">월별 요청 트렌드 (비용 기준)</h3>
            <div className="h-64 flex items-end justify-around gap-2 border-b border-slate-200 pb-2">
                {analysis.monthlyTrends.map(({ month, cost }) => {
                    const date = new Date(month + '-02'); // Add day for valid date parsing
                    const monthLabel = `${date.toLocaleString('ko-KR', { month: 'short' })}`;
                    const heightPercentage = maxMonthlyCost > 0 ? (cost / maxMonthlyCost) * 100 : 0;
                    return (
                        <div key={month} className="flex-1 flex flex-col items-center justify-end h-full group">
                            <div className="relative w-full h-full flex items-end justify-center">
                                <div 
                                    className="w-3/4 bg-green-400 rounded-t-md transition-all duration-300 ease-out group-hover:bg-green-500"
                                    style={{ height: `${heightPercentage}%` }}
                                >
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-slate-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {cost.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500 mt-2">{monthLabel}</span>
                        </div>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
