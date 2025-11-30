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

    const totalCost = logs.reduce((sum, log) => sum + log.total_cost, 0);

    const lineSpendingMap = new Map<string, number>();
    logs.forEach(log => {
      lineSpendingMap.set(log.line, (lineSpendingMap.get(log.line) || 0) + log.total_cost);
    });
    const lineSpending = Array.from(lineSpendingMap.entries())
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);
      
    const monthlyData = new Map<string, { cost: number; count: number }>();
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyData.get(monthKey) || { cost: 0, count: 0 };
      current.cost += log.total_cost;
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

  const SummaryCard: React.FC<{ title: string; value: string | number; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between h-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
    </div>
  );

  if (logs.length === 0) {
    return (
        <div className="text-center bg-white p-12 rounded-2xl shadow-card border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">데이터 없음</h2>
            <p className="text-slate-500">분석할 요청 데이터가 없습니다. 먼저 요청을 제출해주세요.</p>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="총 요청 건수" value={analysis.totalRequests.toLocaleString()} />
        <SummaryCard title="총 요청 비용" value={`${analysis.totalCost.toLocaleString()}원`} />
        <SummaryCard title="활성 라인 수" value={`${analysis.uniqueLines.toLocaleString()}개`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-8 tracking-tight">라인별 지출 현황</h3>
            <div className="space-y-6">
                {analysis.lineSpending.map(({ name, cost }) => (
                    <div key={name} className="group">
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-semibold text-slate-700 text-sm">{name}</span>
                            <span className="text-sm font-bold text-slate-900">{cost.toLocaleString()}원</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-blue-500 h-3 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${(cost / (analysis.lineSpending[0]?.cost || 1)) * 100}%`}}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-8 tracking-tight">월별 비용 트렌드</h3>
            <div className="h-64 flex items-end justify-around gap-4 border-b border-slate-100 pb-2">
                {analysis.monthlyTrends.map(({ month, cost }) => {
                    const date = new Date(month + '-02'); 
                    const monthLabel = `${date.toLocaleString('ko-KR', { month: 'short' })}`;
                    const heightPercentage = maxMonthlyCost > 0 ? (cost / maxMonthlyCost) * 100 : 0;
                    return (
                        <div key={month} className="flex-1 flex flex-col items-center justify-end h-full group">
                            <div className="relative w-full h-full flex items-end justify-center">
                                <div 
                                    className="w-full max-w-[40px] bg-green-400/80 rounded-t-lg transition-all duration-500 ease-out group-hover:bg-green-500"
                                    style={{ height: `${heightPercentage}%` }}
                                >
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {cost.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-slate-500 mt-3">{monthLabel}</span>
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