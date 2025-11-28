import React, { useState, useMemo } from 'react';
import { Game, PlayStatus, STATUS_LABELS, PLATFORMS, GENRES } from '../types';
import { PlatformIcon, StatusIcon, CloudDownload } from './Icons';
import { Search, Star, Swords, Gamepad2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { PlatformImportModal } from './PlatformImportModal';
import { GameDetailsModal } from './GameDetailsModal';

interface GameLibraryProps {
  games: Game[];
  onDelete: (id: string) => void;
  onEdit: (game: Game) => void;
  onImport: (newGames: Partial<Game>[]) => void;
}

type SortOption = 'added' | 'title' | 'rating' | 'hours' | 'year';

// Reusable Cover Component
const GameCover = ({ url, title, className, placeholderClassName }: { url?: string, title: string, className?: string, placeholderClassName?: string }) => {
  const [imgError, setImgError] = useState(false);

  if (!url || imgError) {
    return (
      <div className={`w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-slate-900 transition-colors ${placeholderClassName}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 to-transparent opacity-50"></div>
        <Gamepad2 size={40} className="text-slate-700 mb-2 group-hover:text-indigo-500/50 transition-colors relative z-10" />
        <span className="text-slate-700 font-bold text-[10px] uppercase tracking-widest px-4 text-center z-10 group-hover:text-slate-500 transition-colors">
          暂无封面
        </span>
        <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-900/30 to-transparent"></div>
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={title}
      onError={() => setImgError(true)}
      className={className}
    />
  );
};

export const GameLibrary: React.FC<GameLibraryProps> = ({ games, onDelete, onEdit, onImport }) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  // Filters State
  const [filterStatus, setFilterStatus] = useState<PlayStatus | 'All'>('All');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [filterGenre, setFilterGenre] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showImportModal, setShowImportModal] = useState(false);

  // 1. Filter Logic
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesStatus = filterStatus === 'All' || game.status === filterStatus;
      const matchesSearch = game.title.toLowerCase().includes(search.toLowerCase()) || 
                            game.platform.toLowerCase().includes(search.toLowerCase());
      
      const matchesPlatform = filterPlatform === 'All' || game.platform === filterPlatform;
      const matchesGenre = filterGenre === 'All' || game.genres.some(g => g.includes(filterGenre));

      return matchesStatus && matchesSearch && matchesPlatform && matchesGenre;
    });
  }, [games, filterStatus, search, filterPlatform, filterGenre]);

  // 2. Sort Logic
  const sortedGames = useMemo(() => {
    return [...filteredGames].sort((a, b) => {
      let res = 0;
      switch (sortBy) {
        case 'title':
          res = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'rating':
          res = a.rating - b.rating;
          break;
        case 'hours':
          res = a.hoursPlayed - b.hoursPlayed;
          break;
        case 'year':
          res = (a.releaseYear || '').localeCompare(b.releaseYear || '');
          break;
        case 'added':
        default:
          res = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? res : -res;
    });
  }, [filteredGames, sortBy, sortOrder]);

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc'); 
    }
  };

  const clearFilters = () => {
    setFilterPlatform('All');
    setFilterGenre('All');
    setFilterStatus('All');
    setSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Controls Container */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md sticky top-0 z-30 shadow-2xl flex flex-col gap-4">
        
        {/* Top Row: Import, Search, Toggle Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-900/30 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <CloudDownload size={16} />
              <span className="hidden sm:inline">导入</span>
            </button>

            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="搜索游戏..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
              />
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-xl border transition-colors flex items-center gap-2 text-sm ${showFilters ? 'bg-slate-800 border-indigo-500 text-indigo-400' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">筛选</span>
            </button>
            
             <div className="relative group">
                <button className="h-full px-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
                   <ArrowUpDown size={16} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                   {[
                     { id: 'added', label: '添加时间' },
                     { id: 'rating', label: '评分' },
                     { id: 'hours', label: '游玩时长' },
                     { id: 'year', label: '发行年份' },
                     { id: 'title', label: '游戏标题' },
                   ].map(opt => (
                     <button 
                        key={opt.id}
                        onClick={() => toggleSort(opt.id as SortOption)}
                        className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-indigo-600 hover:text-white flex justify-between items-center ${sortBy === opt.id ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
                     >
                       {opt.label}
                       {sortBy === opt.id && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}
                     </button>
                   ))}
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
             {(['All', 'Playing', 'Completed', 'Backlog', 'Dropped', 'Wishlist'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                  filterStatus === status 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800'
                }`}
              >
                {status === 'All' ? '全部' : STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
             <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">平台</label>
                <select 
                  value={filterPlatform} 
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white"
                >
                   <option value="All">所有平台</option>
                   {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
             </div>
             
             <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">类型</label>
                <select 
                  value={filterGenre} 
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white"
                >
                   <option value="All">所有类型</option>
                   {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>

             <div className="flex items-end">
                <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 py-2">
                   <X size={12} /> 清除筛选
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-10">
        {sortedGames.map(game => (
          <div 
            key={game.id} 
            onClick={() => setSelectedGame(game)}
            className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-600 shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 relative cursor-pointer"
          >
            <div className="h-56 bg-slate-950 relative overflow-hidden z-0">
              <GameCover 
                url={game.coverUrl} 
                title={game.title} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
              
              <div className="absolute top-2 right-2">
                 <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                   <Star size={10} className="text-yellow-400 fill-yellow-400" /> {game.rating > 0 ? game.rating : '-'}
                 </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                 <h3 className="font-bold text-sm text-slate-100 leading-tight line-clamp-2 mb-1 group-hover:text-indigo-300 transition-colors">{game.title}</h3>
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                       <PlatformIcon platform={game.platform} /> {game.platform.split(' ')[0]}
                    </span>
                    <StatusIcon status={game.status} />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600 animate-fade-in">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-xl">
              <Swords size={32} className="opacity-50 text-indigo-500" />
          </div>
          <p className="text-lg font-medium text-slate-400">没有找到相关游戏</p>
          <button onClick={clearFilters} className="text-indigo-400 text-sm mt-2 hover:underline">清除筛选条件</button>
        </div>
      )}

      {showImportModal && <PlatformImportModal onClose={() => setShowImportModal(false)} onImport={onImport} />}
      
      {selectedGame && (
        <GameDetailsModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};
