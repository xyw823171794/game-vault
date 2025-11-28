import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Game, Stats, STATUS_LABELS } from '../types';
import { Calendar, Trophy, Zap, Award } from 'lucide-react';

interface StatsViewProps {
  games: Game[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const StatsView: React.FC<StatsViewProps> = ({ games }) => {
  // Calculate Stats
  const stats: Stats = React.useMemo(() => {
    const s: Stats = {
      totalGames: games.length,
      completedGames: games.filter(g => g.status === 'Completed').length,
      backlogGames: games.filter(g => g.status === 'Backlog').length,
      totalHours: games.reduce((acc, curr) => acc + (curr.hoursPlayed || 0), 0),
      platformDistribution: [],
      statusDistribution: [],
    };

    const pMap = new Map<string, number>();
    const sMap = new Map<string, number>();

    games.forEach(g => {
      // Group platforms loosely
      let pKey = g.platform.split(' ')[0]; 
      if (pKey === 'Nintendo') pKey = 'Switch/3DS';
      if (pKey === 'PlayStation') pKey = 'PS';
      if (pKey === '手游') pKey = 'Mobile';
      if (pKey === 'PC') pKey = 'PC';
      
      pMap.set(pKey, (pMap.get(pKey) || 0) + 1);
      sMap.set(STATUS_LABELS[g.status], (sMap.get(STATUS_LABELS[g.status]) || 0) + 1);
    });

    s.platformDistribution = Array.from(pMap).map(([name, value]) => ({ name, value }));
    s.statusDistribution = Array.from(sMap).map(([name, value]) => ({ name, value }));

    return s;
  }, [games]);

  // Year in Review Logic
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    games.forEach(g => {
      const d = new Date(g.addedAt);
      if (!isNaN(d.getTime())) years.add(d.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [games]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear());

  const yearStats = React.useMemo(() => {
    const yearGames = games.filter(g => new Date(g.addedAt).getFullYear() === selectedYear);
    const addedCount = yearGames.length;
    const completedCount = yearGames.filter(g => g.status === 'Completed').length;
    const completionRate = addedCount > 0 ? Math.round((completedCount / addedCount) * 100) : 0;
    
    const topGame = yearGames.length > 0 
      ? yearGames.reduce((prev, current) => (prev.rating > current.rating) ? prev : current)
      : null;

    // Calc fav genre
    const genreCounts: Record<string, number> = {};
    yearGames.forEach(g => g.genres.forEach(genre => genreCounts[genre] = (genreCounts[genre] || 0) + 1));
    const favGenre = Object.entries(genreCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';

    return { addedCount, completedCount, completionRate, topGame, favGenre };
  }, [games, selectedYear]);


  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="游戏总数" value={stats.totalGames} color="text-white" />
        <StatCard title="总游戏时长" value={`${stats.totalHours.toFixed(1)}h`} color="text-indigo-400" />
        <StatCard title="已通关" value={stats.completedGames} color="text-emerald-400" />
        <StatCard title="待玩库" value={stats.backlogGames} color="text-amber-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2 shrink-0">
            <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
            游玩状态分布
          </h3>
          <div className="flex-1 w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70} // Slightly tighter
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2} // Reduced gap from 5 to 2
                  dataKey="value"
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2 shrink-0">
             <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
             平台分布
          </h3>
          <div className="flex-1 w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.platformDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{fill: '#1e293b', opacity: 0.4}}
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Year in Review Section */}
      <div className="mt-8 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <Calendar className="text-indigo-400" />
             年度游戏回顾
           </h3>
           <div className="relative">
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(Number(e.target.value))}
               className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 pr-8 appearance-none"
             >
               {availableYears.length > 0 ? (
                 availableYears.map(y => <option key={y} value={y}>{y} 年</option>)
               ) : (
                 <option value={new Date().getFullYear()}>{new Date().getFullYear()} 年</option>
               )}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
           <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/50">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">年度收藏</p>
              <div className="text-3xl font-bold text-white">{yearStats.addedCount} <span className="text-sm font-normal text-slate-500">款游戏</span></div>
           </div>
           
           <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/50">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">年度通关率</p>
              <div className="text-3xl font-bold text-emerald-400">{yearStats.completionRate}%</div>
              <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-1000" style={{width: `${yearStats.completionRate}%`}}></div>
              </div>
           </div>

           <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/50">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-1"><Zap size={12} className="text-yellow-400"/> 年度偏好</p>
              <div className="text-xl font-bold text-white truncate" title={yearStats.favGenre}>{yearStats.favGenre}</div>
              <p className="text-xs text-slate-500 mt-1">出现频率最高的类型</p>
           </div>

           <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/50 relative group">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-1"><Award size={12} className="text-purple-400"/> 年度最佳</p>
              {yearStats.topGame ? (
                <>
                  <div className="text-lg font-bold text-white truncate" title={yearStats.topGame.title}>{yearStats.topGame.title}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-xs font-bold border border-yellow-500/30">
                       {yearStats.topGame.rating} 分
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-sm italic">暂无评级数据</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm hover:border-slate-700 transition-colors">
    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
    <p className={`text-3xl font-bold ${color} tracking-tight`}>{value}</p>
  </div>
);