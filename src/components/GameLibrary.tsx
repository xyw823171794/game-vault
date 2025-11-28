import React, { useState } from 'react';
import { Game, PlayStatus, STATUS_LABELS } from '../types';
import { PlatformIcon, StatusIcon, CloudDownload } from './Icons';
import { Search, Clock, Star, Trash2, Edit2, Swords, Gamepad2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SteamImportModal } from './SteamImportModal';

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
  const [filterStatus, setFilterStatus] = useState<PlayStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showImportModal, setShowImportModal] = useState(false);

  // 1. Filter
  const filteredGames = games.filter(game => {
    const matchesStatus = filterStatus === 'All' || game.status === filterStatus;
    const matchesSearch = game.title.toLowerCase().includes(search.toLowerCase()) || 
                          game.platform.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 2. Sort
  const sortedGames = [...filteredGames].sort((a, b) => {
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

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc'); 
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
        <div className="flex gap-2 w-full md:w-auto">
          {/* Import Button */}
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <CloudDownload size={16} />
            <span className="hidden sm:inline">导入平台</span>
          </button>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="搜索..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
            />
          </div>
          
           <div className="relative group">
              <button className="h-full px-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
                 <ArrowUpDown size={16} />
                 <span className="hidden sm:inline">排序</span>
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
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <div className="flex items-center gap-1 shrink-0">
            {(['All', 'Playing', 'Completed', 'Backlog', 'Dropped', 'Wishlist'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  filterStatus === status 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {status === 'All' ? '全部' : STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
        {sortedGames.map(game => (
          <div key={game.id} className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500 pointer-events-none"></div>

            <div className="h-44 bg-slate-950 relative overflow-hidden z-0">
              <GameCover 
                url={game.coverUrl} 
                title={game.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-transform duration-700 ease-out scale-100 group-hover:scale-110"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 ${
                    game.platform.includes('PlayStation') ? 'bg-blue-900/60 text-blue-200' :
                    game.platform.includes('Xbox') ? 'bg-green-900/60 text-green-200' :
                    game.platform.includes('Switch') ? 'bg-red-900/60 text-red-200' :
                    'bg-slate-800/60 text-slate-300'
                  }`}>
                    <PlatformIcon platform={game.platform} />
                    {game.platform.split(' ')[0]} 
                  </span>
                </div>
                {game.releaseYear && (
                    <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded border border-white/5 backdrop-blur-sm">
                      {game.releaseYear}
                    </span>
                )}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col relative z-10 bg-slate-900">
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="font-bold text-base text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">{game.title}</h3>
                <div className="flex-shrink-0 pt-1" title={STATUS_LABELS[game.status]}>
                  <StatusIcon status={game.status} />
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap mb-5">
                {game.genres.slice(0, 3).map(g => (
                  <span key={g} className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-2 py-1 rounded hover:bg-slate-700 transition-colors cursor-default">
                    {g}
                  </span>
                ))}
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-600" />
                    <span className="text-slate-400">{game.hoursPlayed} 小时</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className={game.rating >= 8 ? "text-yellow-500 fill-yellow-500/20" : "text-slate-600"} />
                    <span className={game.rating >= 8 ? "text-yellow-500" : "text-slate-400"}>{game.rating > 0 ? game.rating : '-'}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button 
                    onClick={() => onEdit(game)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-indigo-600 rounded-lg transition-all"
                    title="编辑"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete(game.id)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
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
          <p className="text-sm">尝试更换搜索词或添加新游戏</p>
        </div>
      )}

      {showImportModal && <SteamImportModal onClose={() => setShowImportModal(false)} onImport={onImport} />}
    </div>
  );
};