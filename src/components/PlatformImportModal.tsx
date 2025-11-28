import React, { useState, useEffect } from 'react';
import { X, CloudDownload, CheckCircle, AlertCircle, Loader2, Monitor, Gamepad2, ClipboardList, Settings } from 'lucide-react';
import { Game, PlayStatus } from '../types';

interface PlatformImportModalProps {
  onClose: () => void;
  onImport: (games: Partial<Game>[]) => void;
}

// Steam API Configuration
const STEAM_API_KEY = 'D5A4A3DD81DF8115E0733C8525474702';

// Get Proxy URL dynamically
const getProxyUrl = () => {
    // 1. User Settings
    const local = localStorage.getItem('gv_proxy_url');
    if (local) return local;

    // 2. Env Vars
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CORS_PROXY_URL) {
            // @ts-ignore
            return import.meta.env.VITE_CORS_PROXY_URL;
        }
    } catch(e) {}

    // 3. Default
    return 'https://corsproxy.io/?';
};

export const PlatformImportModal: React.FC<PlatformImportModalProps> = ({ onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<'steam' | 'manual'>('steam');
  
  // Steam State
  const [steamStep, setSteamStep] = useState<'input' | 'loading' | 'confirm'>('input');
  const [inputId, setInputId] = useState('');
  const [steamGames, setSteamGames] = useState<Partial<Game>[]>([]);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [useProxy, setUseProxy] = useState(true);
  const [currentProxyUrl, setCurrentProxyUrl] = useState('');

  // Manual State
  const [manualText, setManualText] = useState('');
  const [manualPlatform, setManualPlatform] = useState('PlayStation 5');
  const [parsedGames, setParsedGames] = useState<Partial<Game>[]>([]);

  useEffect(() => {
      setCurrentProxyUrl(getProxyUrl());
  }, []);

  // --- STEAM LOGIC ---
  const resolveSteamId = async (input: string): Promise<string> => {
    if (/^\d{17}$/.test(input)) return input;
    setLoadingText('正在解析 Steam ID...');
    
    const targetUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${input}`;
    const url = useProxy ? `${currentProxyUrl}${encodeURIComponent(targetUrl)}` : targetUrl;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error resolving ID');
      const data = await res.json();
      if (data.response && data.response.success === 1) return data.response.steamid;
    } catch (e) { console.warn(e); }
    return input;
  };

  const fetchSteamGames = async () => {
    if (!inputId) return;
    setErrorMsg('');
    setSteamStep('loading');
    try {
      const steamId = await resolveSteamId(inputId);
      setLoadingText('正在获取游戏库...');
      
      const targetUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`;
      const url = useProxy ? `${currentProxyUrl}${encodeURIComponent(targetUrl)}` : targetUrl;
      
      const res = await fetch(url);
      
      // Check for HTML response (proxy error)
      const contentType = res.headers.get("content-type");
      if (!res.ok || (contentType && !contentType.includes("application/json"))) {
         if (useProxy) {
            throw new Error(`连接代理失败。请在“设置”中尝试切换为 AllOrigins 或 ThingProxy。`);
         } else {
            throw new Error("直连 Steam API 失败。请开启 '使用 CORS 代理' 并配合 VPN。");
         }
      }

      const data = await res.json();
      if (!data.response || !data.response.games) throw new Error("无法获取列表，请检查隐私设置或网络。");

      const games: Partial<Game>[] = data.response.games
        .filter((g: any) => g.playtime_forever > 0)
        .sort((a: any, b: any) => b.playtime_forever - a.playtime_forever)
        .map((g: any) => ({
          title: g.name,
          hoursPlayed: Math.round((g.playtime_forever / 60) * 10) / 10,
          platform: 'PC (Steam)',
          status: (g.playtime_forever > 600 ? 'Playing' : 'Backlog') as PlayStatus,
          rating: 0,
          genres: [],
          coverUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${g.appid}/library_600x900.jpg`,
          addedAt: new Date().toISOString(),
          lastPlayedAt: g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : undefined,
          notes: `Steam AppID: ${g.appid}`
        }));
      setSteamGames(games);
      setSteamStep('confirm');
    } catch (e: any) {
      console.error(e);
      const isCorsError = e.message.includes('Failed to fetch') || e.name === 'TypeError';
      if (isCorsError && useProxy) {
          setErrorMsg(`请求失败：无法连接到代理 (${currentProxyUrl})。请尝试在“设置”中切换其他代理。`);
      } else if (isCorsError && !useProxy) {
          setErrorMsg("请求失败：发生跨域错误 (CORS)。请开启上方 '使用 CORS 代理' 开关。");
      } else {
          setErrorMsg(e.message || "请求失败，可能是网络问题 (GFW)");
      }
      setSteamStep('input');
    }
  };

  // --- MANUAL LOGIC ---
  const parseManualInput = () => {
    // Expected format: Title, Hours (optional)
    const lines = manualText.split('\n').filter(l => l.trim());
    const games: Partial<Game>[] = lines.map(line => {
      // Simple CSV-ish parsing
      const parts = line.split(/[,，]/); // Split by comma (eng or cn)
      const title = parts[0].trim();
      const hours = parts[1] ? parseFloat(parts[1].trim()) : 0;
      
      return {
        title,
        hoursPlayed: isNaN(hours) ? 0 : hours,
        platform: manualPlatform,
        status: 'Backlog' as PlayStatus,
        rating: 0,
        genres: [],
        addedAt: new Date().toISOString(),
        notes: '手动批量导入'
      };
    }).filter(g => g.title);
    
    setParsedGames(games);
  };

  const handleImport = (games: Partial<Game>[]) => {
    onImport(games);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CloudDownload className="text-indigo-400" />
            游戏数据导入
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button 
            onClick={() => setActiveTab('steam')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'steam' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <Monitor size={18} /> Steam 自动同步
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'manual' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <ClipboardList size={18} /> 其他平台 (批量文本)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* --- STEAM TAB --- */}
          {activeTab === 'steam' && (
            <>
              {steamStep === 'input' && (
                <div className="space-y-4">
                   <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg flex flex-col gap-2">
                      <div className="flex gap-2 items-start">
                        <AlertCircle className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-indigo-200">
                            <p className="font-bold mb-1">提示</p>
                            <p>请确保 Steam 资料和游戏详情已公开。如果遇到连接错误，请尝试开启 VPN 或在<span className="font-bold text-white">设置</span>中更换代理。</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-indigo-500/20 flex items-center justify-between">
                         <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useProxy ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${useProxy ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} className="hidden" />
                            <span>使用 CORS 代理</span>
                         </label>
                         <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={currentProxyUrl}>
                            当前: {currentProxyUrl}
                         </span>
                      </div>
                   </div>

                   {errorMsg && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">{errorMsg}</div>}
                   
                   <div>
                     <input 
                        type="text" 
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                        placeholder="输入 Steam ID..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none"
                     />
                   </div>
                   <button 
                     onClick={fetchSteamGames}
                     disabled={!inputId}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
                   >
                     获取列表
                   </button>
                </div>
              )}

              {steamStep === 'loading' && (
                <div className="py-12 text-center space-y-4">
                  <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto" />
                  <p className="text-slate-400">{loadingText}</p>
                </div>
              )}

              {steamStep === 'confirm' && (
                <GameListPreview games={steamGames} onImport={() => handleImport(steamGames)} onRetry={() => setSteamStep('input')} />
              )}
            </>
          )}

          {/* --- MANUAL TAB --- */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
               {parsedGames.length === 0 ? (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">选择平台</label>
                        <select 
                          value={manualPlatform}
                          onChange={(e) => setManualPlatform(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="PlayStation 5">PlayStation 5</option>
                          <option value="PlayStation 4">PlayStation 4</option>
                          <option value="Xbox Series X/S">Xbox Series X/S</option>
                          <option value="Nintendo Switch">Nintendo Switch</option>
                          <option value="PC (Epic)">PC (Epic)</option>
                          <option value="手游 (iOS)">手游 (iOS)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase mb-2">
                        批量输入 (格式: 游戏名, 游玩时长)
                      </label>
                      <textarea
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder={`例如：\n战神：诸神黄昏, 45\n最终幻想16, 60\n蜘蛛侠2`}
                        className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm focus:border-indigo-500 outline-none resize-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-2">* 每行一个游戏。时长为可选（默认为 0）。</p>
                    </div>
                    
                    <button 
                       onClick={parseManualInput}
                       disabled={!manualText.trim()}
                       className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
                    >
                       解析内容
                    </button>
                 </>
               ) : (
                 <GameListPreview games={parsedGames} onImport={() => handleImport(parsedGames)} onRetry={() => setParsedGames([])} />
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GameListPreview = ({ games, onImport, onRetry }: { games: Partial<Game>[], onImport: () => void, onRetry: () => void }) => (
  <div className="space-y-4 h-full flex flex-col">
    <div className="flex justify-between items-center mb-2">
      <h4 className="text-white font-bold">解析到 {games.length} 款游戏</h4>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-[200px] max-h-[400px]">
      {games.map((g, i) => (
        <div key={i} className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
           {g.coverUrl ? (
             <img src={g.coverUrl} className="w-8 h-10 object-cover rounded" alt="" />
           ) : (
             <div className="w-8 h-10 bg-slate-900 rounded flex items-center justify-center"><Gamepad2 size={14} className="text-slate-700"/></div>
           )}
           <div className="flex-1 min-w-0">
             <div className="text-sm font-bold text-slate-200 truncate">{g.title}</div>
             <div className="text-xs text-slate-500">{g.platform} • {g.hoursPlayed}h</div>
           </div>
           <CheckCircle size={16} className="text-emerald-500 shrink-0" />
        </div>
      ))}
    </div>
    <div className="flex gap-3 pt-4 border-t border-slate-800">
      <button onClick={onRetry} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-lg font-medium">重试</button>
      <button onClick={onImport} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20">
        确认导入
      </button>
    </div>
  </div>
);