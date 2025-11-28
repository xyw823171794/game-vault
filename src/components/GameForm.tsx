import React, { useState } from 'react';
import { Game, PlayStatus, PLATFORMS, STATUS_LABELS } from '../types';
import { fetchGameMetadata, generateGameCover } from '../services/aiService';
import { Search, Loader2, Sparkles, Save, X, Database, Image as ImageIcon, Wand2, Globe } from 'lucide-react';

interface GameFormProps {
  onSave: (game: Omit<Game, 'id' | 'addedAt'>) => void;
  onCancel: () => void;
  initialData?: Game;
}

export const GameForm: React.FC<GameFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<Game>>(initialData || {
    title: '',
    platform: PLATFORMS[0],
    status: 'Backlog',
    rating: 0,
    hoursPlayed: 0,
    genres: [],
    notes: '',
    coverUrl: ''
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [imgGenLoading, setImgGenLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAiFill = async () => {
    if (!searchQuery) return;
    setAiLoading(true);
    try {
      const metadata = await fetchGameMetadata(searchQuery);
      setFormData(prev => ({
        ...prev,
        title: metadata.title,
        releaseYear: metadata.releaseYear,
        genres: metadata.genres.slice(0, 3), 
        platform: normalizePlatform(metadata.platforms) || prev.platform, 
        notes: prev.notes ? prev.notes : metadata.description 
      }));
    } catch (e) {
      alert("无法获取游戏数据，请重试或手动输入。");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!formData.title) {
      alert("请先输入游戏标题");
      return;
    }
    setImgGenLoading(true);
    try {
      const base64Image = await generateGameCover(formData.title);
      setFormData(prev => ({ ...prev, coverUrl: base64Image }));
    } catch (e) {
      alert("生成封面失败，请重试。");
    } finally {
      setImgGenLoading(false);
    }
  };

  // Helper to map AI platform string to our Chinese specific enum
  const normalizePlatform = (aiPlatforms: string[]): string | undefined => {
    const joined = aiPlatforms.join(' ').toLowerCase();
    
    // Check strict specific platforms first
    if (joined.includes('switch') || joined.includes('nintendo')) return 'Nintendo Switch';
    if (joined.includes('ps5') || joined.includes('playstation 5')) return 'PlayStation 5';
    if (joined.includes('ps4') || joined.includes('playstation 4')) return 'PlayStation 4';
    if (joined.includes('series') || joined.includes('xbox')) return 'Xbox Series X/S';
    
    // Check mobile
    if (joined.includes('ios') || joined.includes('iphone') || joined.includes('ipad')) return '手游 (iOS)';
    if (joined.includes('android') || joined.includes('安卓')) return '手游 (Android)';
    
    // General fallbacks
    if (joined.includes('steam') || joined.includes('pc') || joined.includes('windows') || joined.includes('mac')) return 'PC (Steam)';
    
    return undefined;
  };

  const handleChange = (field: keyof Game, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onSave(formData as Omit<Game, 'id' | 'addedAt'>);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          {initialData ? <Database className="text-indigo-500" /> : <Sparkles className="text-indigo-500" />}
          {initialData ? '编辑游戏' : '添加新游戏'}
        </h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {!initialData && (
        <div className="mb-8 bg-indigo-950/20 p-5 rounded-xl border border-indigo-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <label className="block text-indigo-300 text-sm font-medium mb-3 flex items-center gap-2 relative z-10">
            <Globe size={16} className="text-indigo-400" /> 
            全网数据获取 (中文源)
          </label>
          <div className="flex gap-2 relative z-10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入游戏名 (如: 黑神话)"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-600 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleAiFill()}
            />
            <button
              onClick={handleAiFill}
              disabled={aiLoading || !searchQuery}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-900/50"
            >
              {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              获取资料
            </button>
          </div>
          <p className="text-[10px] text-indigo-400/60 mt-2 ml-1">* 数据由 AI 检索中文网络资料库生成 (豆瓣/Steam等)</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">游戏标题</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">游玩平台</label>
            <div className="relative">
              <select
                value={formData.platform}
                onChange={(e) => handleChange('platform', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">当前状态</label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
            </div>
          </div>
          
           <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">发行年份</label>
            <input
              type="text"
              value={formData.releaseYear || ''}
              onChange={(e) => handleChange('releaseYear', e.target.value)}
              placeholder="YYYY"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">已玩时长 (小时)</label>
            <input
              type="number"
              min="0"
              value={formData.hoursPlayed}
              onChange={(e) => handleChange('hoursPlayed', parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">评分 (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.rating}
              onChange={(e) => handleChange('rating', parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="col-span-2">
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">封面图片 (URL)</label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                    type="text"
                    value={formData.coverUrl || ''}
                    onChange={(e) => handleChange('coverUrl', e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleGenerateCover}
                    disabled={imgGenLoading || !formData.title}
                    className="bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                    title="使用 AI 生成封面 (Gemini)"
                >
                    {imgGenLoading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    AI 生成
                </button>
            </div>
            {formData.coverUrl && (
                <div className="mt-4 w-32 aspect-[3/4] rounded-lg overflow-hidden border border-slate-700 shadow-lg bg-slate-950">
                    <img src={formData.coverUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
            )}
          </div>

           <div className="col-span-2">
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">类型标签 (逗号分隔)</label>
            <input
              type="text"
              value={formData.genres?.join(', ')}
              onChange={(e) => handleChange('genres', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              placeholder="RPG, 动作, 开放世界"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">备注 / 简介</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all"
              placeholder="记录一下你的游玩感想..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 text-sm"
          >
            <Save size={16} /> 保存记录
          </button>
        </div>
      </form>
    </div>
  );
};