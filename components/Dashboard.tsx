import React, { useState, useEffect, useMemo } from 'react';
import { Consultation } from '../types';
import { fetchConsultations } from '../services/api';
import { Button } from './ui/Button';
import { SkeletonList } from './ui/Skeleton';

interface DashboardProps {
  onNewClick: () => void;
  onEditClick: (item: Consultation) => void;
  refreshTrigger: number; // Increment to reload
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewClick, onEditClick, refreshTrigger }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate Year Options (Current - 5 to Current + 1)
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchConsultations(year, month);
        setData(result);
      } catch (e) {
        console.error("Failed to load", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [year, month, refreshTrigger]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter(item => 
      item.name.includes(lowerSearch) || 
      item.furigana.includes(lowerSearch) ||
      item.content.includes(lowerSearch)
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-[70px] z-30">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 items-center w-full md:w-auto">
             <select 
               className="form-select block w-24 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
               value={year}
               onChange={(e) => setYear(Number(e.target.value))}
             >
               {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
             </select>
             <select 
               className="form-select block w-20 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
               value={month}
               onChange={(e) => setMonth(Number(e.target.value))}
             >
               {monthOptions.map(m => <option key={m} value={m}>{m}月</option>)}
             </select>
             <div className="text-sm font-bold text-teal-600 whitespace-nowrap ml-2">
               {filteredData.length} 件
             </div>
          </div>

          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="名前、キーワードで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <SkeletonList />
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
             <p className="text-lg">データが見つかりません</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onEditClick(item)}
                className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 group-hover:bg-teal-600 transition-colors"></div>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 pl-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {item.receptionDate}
                      </span>
                      {item.firstVisitDate && (
                         <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            訪問予定
                         </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      {item.name} 
                      <span className="text-sm text-gray-500 font-normal ml-2">({item.gender})</span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      <span className="font-semibold mr-1">相談:</span>{item.content}
                    </p>
                  </div>
                  <div className="md:text-right flex flex-row md:flex-col justify-between items-center md:items-end mt-2 md:mt-0 text-sm text-gray-500">
                    <div>
                      <span className="text-xs block text-gray-400">担当</span>
                      {item.staffName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) or Sticky Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button 
          variant="primary" 
          onClick={onNewClick} 
          className="rounded-full w-14 h-14 shadow-lg flex items-center justify-center p-0 md:w-auto md:h-auto md:py-3 md:px-6 md:rounded-lg"
        >
          <svg className="w-6 h-6 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden md:inline font-bold">新規相談登録</span>
        </Button>
      </div>
    </div>
  );
};