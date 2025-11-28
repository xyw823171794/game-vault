
import React, { useState, useEffect } from 'react';
import { X, Save, Settings as SettingsIcon, Globe, Key, Server, RefreshCw, Zap } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

const COMMON_PROXIES = [
  { label: 'CorsProxy.io (推荐)', value: 'https://corsproxy.io/?' },
  { label: 'AllOrigins', value: 'https://api.allorigins.win/raw?url=' },
  { label: 'CodeTabs (较快)', value: 'https://api.codetabs.com/v1/proxy?quest=' },
  { label: 'ThingProxy', value: 'https://thingproxy.freeboard.io/fetch/' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');

  useEffect(() => {
    setApiKey(localStorage.getItem('gv_api_key') || '');
    setBaseUrl(localStorage.getItem('gv_base_url') || '');
    // Default to corsproxy, but allow empty for direct
    const savedProxy = localStorage.getItem('gv_proxy_url');
    setProxyUrl(savedProxy !== null ? savedProxy : 'https://corsproxy.io/?');
  }, []);

  const handleSave = () => {
    localStorage.setItem('gv_api_key', apiKey.trim());
    localStorage.setItem('gv_base_url', baseUrl.trim());
    localStorage.setItem('gv_proxy_url', proxyUrl.trim());
    
    alert('设置已保存！部分功能将在下次请求时生效。');
    onClose();
  };

  const handleReset = () => {
    if(confirm('确定要恢复默认设置吗？')) {
        setApiKey('');
        setBaseUrl('');
        setProxyUrl('https://corsproxy.io/?');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="text-indigo-400" />
            网络与 API 设置
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg text-xs text-indigo-200">
            <p className="font-bold mb-1">🌏 中国大陆访问优化指南</p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Gemini API: 需使用 VPN 或配置国内镜像(Base URL)。</li>
              <li>Steam 导入: 推荐尝试 <b>CodeTabs</b> 或 <b>AllOrigins</b>。</li>
              <li>终极方案: 若公共代理全挂，请使用“直连”并配合本地游戏加速器。</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                <Key size={14} /> Gemini API Key
              </label>
              <input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="在此输入您的 Key (留空则使用环境变量)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                <Globe size={14} /> Gemini Base URL (选填 / 镜像地址)
              </label>
              <input 
                type="text" 
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="例如: https://openai.proxy.com (留空默认)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-1">如果您使用国内中转服务(如 OneAPI)，请在此填入地址。</p>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                <Server size={14} /> CORS 代理地址 (用于 Steam)
              </label>
              <input 
                type="text" 
                value={proxyUrl}
                onChange={e => setProxyUrl(e.target.value)}
                placeholder="留空即为直连 (不使用代理)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors mb-2"
              />
              <div className="flex flex-wrap gap-2">
                {COMMON_PROXIES.map(p => (
                   <button 
                     key={p.label}
                     onClick={() => setProxyUrl(p.value)}
                     className="px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded hover:bg-slate-700 border border-slate-700 transition-colors"
                   >
                     {p.label}
                   </button>
                ))}
                 <button 
                     onClick={() => setProxyUrl('')}
                     className="px-2 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 text-xs rounded hover:bg-emerald-900/50 flex items-center gap-1"
                   >
                     <Zap size={10} /> 直连 (加速器)
                   </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                 * CodeTabs 在国内部分网络环境下速度较快。
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
             <button 
                onClick={handleReset}
                className="px-4 py-3 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="恢复默认"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
              >
                <Save size={18} /> 保存配置
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
