import React, { useState, useMemo } from 'react';
import { Game } from '../types';
import { PlatformIcon, StatusIcon } from './Icons';
import { Clock, Calendar, Star, Gamepad2, History, ChevronDown, ChevronRight, Hash } from 'lucide-react';

interface TimelineViewProps {
  games: Game[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ games }) => {
  
  const getTimelineDate = (game: Game) => {
    return game.lastPlayedAt ? new Date(game.lastPlayedAt) : new Date(game.addedAt);
  };

  // 1. Group games by Year
  const groupedGames = useMemo(() => {
    const groups: Record<number, Game[]> = {};
    
    // Sort all games first
    const sorted = [...games].sort((a, b) => 
      getTimelineDate(b).getTime() - getTimelineDate(a).getTime()
    );

    sorted.forEach(game => {
      const year = getTimelineDate(game).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(game);
    });

    return groups;
  }, [games]);

  // Get sorted years descending
  const years = useMemo(() => Object.keys(groupedGames).map(Number).sort((a, b) => b - a), [groupedGames]);

  // State for collapsible years (Default open the most recent year)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(() => {
    return new Set(years.length > 0 ? [years[0]] : []);
  });

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 relative animate-fade-in">
       {/* Introduction */}
       <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full mb-4 ring-1 ring-indigo-500/30">
            <Clock className="text-indigo-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white">游戏时光机</h2>
          <p className="text-slate-400 mt-2">按年份回顾您的游玩历程，见证每一个投入的小时。</p>
       </div>

       <div className="space-y-8">
          {years.map(year => {
             const isExpanded = expandedYears.has(year);
             const yearGames = groupedGames[year];
             const totalHoursInYear = yearGames.reduce((acc, g) => acc + (g.hoursPlayed || 0), 0);

             return (
               <div key={year} className="relative">
                  {/* Year Header (Sticky-ish) */}
                  <div 
                    onClick={() => toggleYear(year)}
                    className="flex items-center gap-4 cursor-pointer group mb-6 select-none"
                  >
                     <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                     </div>
                     <h3 className="text-3xl font-black text-slate-200 group-hover:text-white transition-colors tracking-tight flex items-baseline gap-3">
                        {year}
                        <span className="text-sm font-medium text-slate-500 font-mono">
                           {yearGames.length} 款游戏 • {totalHoursInYear.toFixed(1)} 小时
                        </span>
                     </h3>
                     <div className="h-px bg-slate-800 flex-1 group-hover:bg-slate-700 transition-colors"></div>
                  </div>

                  {/* Games List (Timeline Style) */}
                  {isExpanded && (
                    <div className="relative pl-6 md:pl-0 animate-fade-in">
                        {/* Vertical Line for this year block */}
                        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-800 transform md:-translate-x-1/2"></div>

                        <div className="space-y-12 py-4">
                          {yearGames.map((game, index) => {
                            const timelineDate = getTimelineDate(game);
                            const month = timelineDate.getMonth() + 1;
                            const dateStr = `${month}月`;
                            const isPlayedTime = !!game.lastPlayedAt;
                            const isEven = index % 2 === 0;

                            return (
                              <div key={game.id} className={`relative flex items-center md:justify-between ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                                
                                {/* Date Bubble (Center) */}
                                <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 z-10 transform -translate-x-1/2"></div>

                                {/* Spacer for desktop layout */}
                                <div className="hidden md:block w-1/2" />

                                {/* Content Card */}
                                <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${!isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                                  
                                  {/* Date Label */}
                                  <div className={`text-sm font-mono font-bold text-slate-500 mb-2 flex items-center gap-2 ${!isEven ? 'md:justify-end' : ''}`}>
                                    {isPlayedTime ? <History size={14} /> : <Calendar size={14} />}
                                    {dateStr}
                                  </div>

                                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl hover:border-indigo-500/50 transition-all group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className={`flex gap-4 ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                                      {/* Thumbnail */}
                                      <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-950 shadow-md relative border border-slate-800">
                                          {game.coverUrl ? (
                                            <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                              <Gamepad2 size={20} />
                                            </div>
                                          )}
                                      </div>

                                      {/* Info */}
                                      <div className={`flex-1 min-w-0 flex flex-col justify-center ${!isEven ? 'md:items-end' : ''}`}>
                                          <h3 className="text-base font-bold text-white leading-tight truncate w-full group-hover:text-indigo-300 transition-colors">{game.title}</h3>
                                          
                                          <div className={`flex items-center gap-2 mt-1 mb-2 text-xs text-slate-400 ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                                            <span className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">
                                                <PlatformIcon platform={game.platform} /> {game.platform.split(' ')[0]}
                                            </span>
                                          </div>

                                          {/* Playtime */}
                                          <div className={`flex items-center gap-1 text-sm font-bold ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                                            <Clock size={14} className="text-emerald-400" />
                                            <span className="text-emerald-400">{Number(game.hoursPlayed).toFixed(1)} 小时</span>
                                            {game.rating > 0 && (
                                              <>
                                                <span className="text-slate-700 mx-1">|</span>
                                                <span className="text-yellow-500 text-xs flex items-center gap-1">
                                                  <Star size={12} fill="currentColor"/> {game.rating}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    </div>
                  )}
               </div>
             );
          })}

          {years.length === 0 && (
            <div className="text-center py-20 text-slate-600">
              <Hash size={48} className="mx-auto mb-4 opacity-50" />
              <p>暂无时间轴数据</p>
            </div>
          )}
       </div>
    </div>
  );
};