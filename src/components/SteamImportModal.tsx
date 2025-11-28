
import React, { useState } from 'react';
import { X, CloudDownload, CheckCircle, AlertCircle, Loader2, Monitor, Gamepad2, Search } from 'lucide-react';
import { Game } from '../types';

interface SteamImportModalProps {
  onClose: () => void;
  onImport: (games: Partial<Game>[]) => void;
}

// Steam API Configuration
const STEAM_API_KEY = 'D5A4A3DD81DF8115E0733C8525474702';
const CORS_PROXY = 'https://corsproxy.io/?';

export const SteamImportModal: React.FC<SteamImportModalProps> = ({ onClose, onImport }) => {
  const [step, setStep] = useState<'select' | 'input' | 'loading' | 'confirm'>('select');
  const [platform, setPlatform] = useState<string>('steam');
  const [inputId, setInputId] = useState('');
  const [fetchedGames, setFetchedGames] = useState<Partial<Game>[]>([]);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Resolve Vanilla URL (Nickname) to SteamID64
  const resolveSteamId = async (input: string): Promise<string> => {
    // Check if input is already a SteamID64 (17 digits)
    if (/^\d{17}$/.test(input)) return input;

    setLoadingText('正在解析 Steam ID...');
    const url = `${CORS_PROXY}${encodeURIComponent(
      `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${input}`
    )}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.response && data.response.success === 1) {
        return data.response.steamid;
      }
    } catch (e) {
      console.warn("Vanity URL resolution failed", e);
    }
    // Return original input if resolution fails (user might have entered a non-standard ID)
    return input;
  };

  // Step 2: Fetch Owned Games
  const fetchGames = async () => {
    if (!inputId) return;
    setErrorMsg('');
    setStep('loading');

    try {
      const steamId = await resolveSteamId(inputId);
      
      setLoadingText('正在获取游戏库...');
      const url = `${CORS_PROXY}${encodeURIComponent(
        `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`
      )}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.response || !data.response.games) {
        throw new Error("无法获取游戏列表，请确认您的 Steam 个人资料和游戏详情已设置为“公开”。");
      }

      // Process Data
      const games: Partial<Game>[] = data.response.games
        .filter((g: any) => g.playtime_forever > 0) // Filter out games with 0 playtime
        .sort((a: any, b: any) => b.playtime_forever - a.playtime_forever) // Sort by playtime desc
        .map((g: any) => ({
          title: g.name,
          // Convert minutes to hours, 1 decimal place
          hoursPlayed: Math.round((g.playtime_forever / 60) * 10) / 10,
          platform: 'PC (Steam)',
          status: g.playtime_forever > 600 ? 'Playing' : 'Backlog', // Simple logic: >10h = Playing
          rating: 0,
          genres: [], // Steam API doesn't return genres in this endpoint
          // Construct library image URL
          coverUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${g.appid}/library_600x900.jpg`,
          addedAt: new Date().toISOString(), // This is the import date
          // capture rtime_last_played (Unix timestamp in seconds) if available
          lastPlayedAt: g.rtime_last_played && g.rtime_last_played > 0 
            ? new Date(g.rtime_last_played * 1000).toISOString() 
            : undefined,
          notes: `Steam AppID: ${g.appid}`
        }));

      setFetchedGames(games);
      setStep('confirm');

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "请求失败，请检查网络或隐私设置。");
      setStep('input');
    }
  };

  const handleConfirmImport = () => {
    onImport(fetchedGames);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CloudDownload className="text-indigo-400" />
            导入平台数据
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Step 1: Select Platform */}
          {step === 'select' && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setPlatform('steam'); setStep('input'); }}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800/50 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500 rounded-xl transition-all group"
              >
                <Monitor size={40} className="text-slate-400 group-hover:text-indigo-400" />
                <span className="font-bold text-slate-200">Steam</span>
              </button>
              
              {['PlayStation', 'Xbox', 'Switch'].map(p => (
                <button 
                  key={p}
                  disabled
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800/20 border border-slate-800 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <Gamepad2 size={40} className="text-slate-600" />
                  <span className="font-bold text-slate-500">{p} (开发中)</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Input ID */}
          {step === 'input' && (
            <div className="space-y-4">
               <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg space-y-2">
                  <div className="flex gap-2 text-sm text-indigo-200 font-bold items-center">
                    <AlertCircle className="shrink-0" size={16} /> 隐私设置提示
                  </div>
                  <p className="text-xs text-indigo-300/80 leading-relaxed">
                    请确保您的 Steam 个人资料和游戏详情均已设为<b>“公开”</b>，否则无法读取数据。
                  </p>
               </div>
               
               {errorMsg && (
                 <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg">
                   {errorMsg}
                 </div>
               )}

               <div>
                 <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Steam ID / 个性化后缀</label>
                 <div className="relative">
                    <input 
                        type="text" 
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                        placeholder="例如: 765611980... 或 gaben"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && fetchGames()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <Monitor size={16} />
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 mt-2">
                   * 支持输入 SteamID64 (纯数字) 或 个人主页 URL 的最后一部分 (Vanity URL)
                 </p>
               </div>
               <button 
                 onClick={fetchGames}
                 disabled={!inputId}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
               >
                 <Search size={18} /> 获取游戏列表
               </button>
            </div>
          )}

          {/* Step 3: Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <Loader2 size={48} className="text-indigo-500 animate-spin relative z-10" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">{loadingText}</h4>
                <p className="text-slate-500 text-sm mt-1">跨域请求可能需要几秒钟...</p>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4 h-full flex flex-col">
               <div className="flex justify-between items-center mb-2 shrink-0">
                 <h4 className="text-white font-bold">发现 {fetchedGames.length} 款游戏</h4>
                 <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">已按时长排序</span>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-[200px]">
                 {fetchedGames.map((g, i) => (
                   <div key={i} className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors group">
                     <div className="w-10 h-14 bg-slate-900 rounded overflow-hidden shrink-0 relative">
                        {g.coverUrl ? (
                             <img src={g.coverUrl} className="w-full h-full object-cover" loading="lazy" onError={(e) => e.currentTarget.style.display = 'none'} alt="" />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 -z-10">
                            <Gamepad2 size={16} className="text-slate-700"/>
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{g.title}</div>
                       <div className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="text-emerald-500 font-medium">{g.hoursPlayed}h</span>
                          <span className="text-slate-700">•</span>
                          <span>{g.status === 'Playing' ? '常玩' : '库存'}</span>
                          {g.lastPlayedAt && (
                              <span className="text-slate-600 ml-1">• {new Date(g.lastPlayedAt).getFullYear()}</span>
                          )}
                       </div>
                     </div>
                     <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                   </div>
                 ))}
               </div>
               
               <div className="flex gap-3 pt-4 border-t border-slate-800 shrink-0">
                  <button 
                    onClick={() => setStep('input')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg font-medium transition-colors"
                  >
                    返回重试
                  </button>
                  <button 
                    onClick={handleConfirmImport}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CloudDownload size={18} /> 全部导入
                  </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
