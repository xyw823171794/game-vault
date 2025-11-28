import React from 'react';
import { Game, STATUS_LABELS } from '../types';
import { PlatformIcon, StatusIcon } from './Icons';
import { X, Clock, Calendar, Star, Edit2, Trash2, Tag, Gamepad2, AlignLeft } from 'lucide-react';

interface GameDetailsModalProps {
  game: Game;
  onClose: () => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({ game, onClose, onEdit, onDelete }) => {
  
  const handleEdit = () => {
    onEdit(game);
    onClose();
  };

  const handleDelete = () => {
    onDelete(game.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        {/* Left Column: Cover Art */}
        <div className="w-full md:w-2/5 h-64 md:h-auto bg-slate-950 relative overflow-hidden group">
           {game.coverUrl ? (
             <>
               <img src={game.coverUrl} className="w-full h-full object-cover" alt={game.title} />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r" />
             </>
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-700 flex-col gap-4">
               <Gamepad2 size={64} className="opacity-50" />
               <span className="text-sm font-bold tracking-widest uppercase">暂无封面</span>
             </div>
           )}
           
           {/* Rating Badge Overlay */}
           {game.rating > 0 && (
             <div className="absolute top-4 left-4 bg-yellow-500/90 text-black font-black px-3 py-1 rounded-lg shadow-lg flex items-center gap-1 backdrop-blur-sm">
                <Star size={16} fill="black" /> {game.rating}
             </div>
           )}
        </div>

        {/* Right Column: Details */}
        <div className="flex-1 p-8 flex flex-col overflow-y-auto custom-scrollbar bg-slate-900 relative">
          
          {/* Header */}
          <div className="mb-6">
             <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-white/5 ${
                    game.platform.includes('PlayStation') ? 'bg-blue-900/40 text-blue-200' :
                    game.platform.includes('Xbox') ? 'bg-green-900/40 text-green-200' :
                    game.platform.includes('Switch') ? 'bg-red-900/40 text-red-200' :
                    'bg-slate-800/60 text-slate-300'
                }`}>
                  <PlatformIcon platform={game.platform} />
                  {game.platform}
                </span>
                {game.releaseYear && (
                   <span className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-0.5 rounded">
                     {game.releaseYear}
                   </span>
                )}
             </div>
             
             <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{game.title}</h2>
             
             {/* Stats Row */}
             <div className="flex flex-wrap gap-4 md:gap-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                   <StatusIcon status={game.status} className="w-5 h-5" />
                   <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold">状态</div>
                      <div className="text-sm font-medium text-slate-200">{STATUS_LABELS[game.status]}</div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Clock className="w-5 h-5 text-emerald-400" />
                   <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold">已玩时长</div>
                      <div className="text-sm font-medium text-slate-200">{game.hoursPlayed} 小时</div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-indigo-400" />
                   <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold">添加时间</div>
                      <div className="text-sm font-medium text-slate-200">{new Date(game.addedAt).toLocaleDateString()}</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Tags */}
          {game.genres.length > 0 && (
            <div className="mb-6">
               <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                 <Tag size={14} /> 类型标签
               </h3>
               <div className="flex flex-wrap gap-2">
                 {game.genres.map(g => (
                   <span key={g} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors border border-slate-700/50">
                     {g}
                   </span>
                 ))}
               </div>
            </div>
          )}

          {/* Notes / Description */}
          <div className="flex-1 min-h-[100px]">
             <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
               <AlignLeft size={14} /> 简介 / 备注
             </h3>
             <div className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap">
               {game.notes || "暂无描述..."}
             </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-slate-800">
            <button 
              onClick={handleEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl transition-all font-medium group"
            >
              <Edit2 size={16} className="group-hover:-translate-y-0.5 transition-transform" /> 编辑
            </button>
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 rounded-xl transition-all font-medium group"
            >
              <Trash2 size={16} className="group-hover:-translate-y-0.5 transition-transform" /> 删除
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};