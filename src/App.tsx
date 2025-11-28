import React, { useState, useEffect } from 'react';
import { Game } from './types';
import { GameLibrary } from './components/GameLibrary';
import { GameForm } from './components/GameForm';
import { StatsView } from './components/StatsView';
import { TimelineView } from './components/TimelineView';
import { SettingsModal } from './components/SettingsModal';
import { LayoutDashboard, Library, PlusCircle, Gamepad2, Ghost, History, Settings } from 'lucide-react';

const STORAGE_KEY = 'gamevault_data';

// Mock Initial Data if empty
const INITIAL_GAMES: Game[] = [
  {
    id: '1',
    title: '艾尔登法环 (Elden Ring)',
    platform: 'PC (Steam)',
    status: 'Completed',
    rating: 10,
    hoursPlayed: 125,
    genres: ['RPG', '动作', '开放世界'],
    releaseYear: '2022',
    addedAt: new Date(2022, 2, 15).toISOString(),
    lastPlayedAt: new Date(2022, 4, 10).toISOString(),
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_Art.jpg'
  },
  {
    id: '2',
    title: '塞尔达传说：王国之泪',
    platform: 'Nintendo Switch',
    status: 'Playing',
    rating: 9.5,
    hoursPlayed: 45,
    genres: ['冒险', '开放世界'],
    releaseYear: '2023',
    addedAt: new Date(2023, 5, 12).toISOString(),
    lastPlayedAt: new Date(2023, 6, 20).toISOString(),
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg'
  },
  {
    id: '3',
    title: '黑神话：悟空',
    platform: 'PC (Steam)',
    status: 'Backlog',
    rating: 0,
    hoursPlayed: 0,
    genres: ['动作', 'RPG'],
    releaseYear: '2024',
    addedAt: new Date(2024, 7, 20).toISOString(),
    coverUrl: 'https://upload.wikimedia.org/wikipedia/zh/a/a3/Black_Myth_Wukong_cover_art.jpg'
  }
];

type View = 'dashboard' | 'library' | 'history' | 'add';

const App = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingGame, setEditingGame] = useState<Game | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGames(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved games", e);
        setGames(INITIAL_GAMES);
      }
    } else {
      setGames(INITIAL_GAMES);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  }, [games]);

  const handleSaveGame = (gameData: Omit<Game, 'id' | 'addedAt'>) => {
    if (editingGame) {
      setGames(prev => prev.map(g => g.id === editingGame.id ? { ...g, ...gameData } : g));
      setEditingGame(undefined);
    } else {
      const newGame: Game = {
        ...gameData,
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString()
      };
      setGames(prev => [newGame, ...prev]);
    }
    setCurrentView('library');
  };

  const handleImportGames = (newGames: Partial<Game>[]) => {
    const gamesToAdd: Game[] = newGames.map(g => ({
       id: crypto.randomUUID(),
       title: g.title || 'Unknown',
       platform: g.platform || 'Other',
       status: g.status || 'Backlog',
       rating: g.rating || 0,
       hoursPlayed: g.hoursPlayed || 0,
       genres: g.genres || [],
       releaseYear: g.releaseYear || '',
       coverUrl: g.coverUrl || '',
       addedAt: g.addedAt || new Date().toISOString(),
       lastPlayedAt: g.lastPlayedAt, // Pass this field through
       notes: g.notes || 'Imported from platform'
    }));
    
    setGames(prev => [...gamesToAdd, ...prev]);
    alert(`成功导入 ${gamesToAdd.length} 款游戏！`);
  };

  const handleDeleteGame = (id: string) => {
    if (confirm('确定要删除这条游戏记录吗？')) {
      setGames(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setCurrentView('add');
  };

  return (
    <div className="min-h-screen bg-[#050910] flex text-slate-200 selection:bg-indigo-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-950 border-r border-slate-900 flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="h-24 flex items-center justify-center lg:justify-start lg:px-6">
          <div className="relative group cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
              <Gamepad2 className="text-indigo-400" size={24} />
            </div>
          </div>
          <h1 className="hidden lg:block ml-3 text-xl font-bold tracking-tight text-white font-sans cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            Game<span className="text-indigo-500">Vault</span>
          </h1>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3 lg:px-4">
          <NavButton 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="数据概览" 
          />
          <NavButton 
            active={currentView === 'library'} 
            onClick={() => setCurrentView('library')} 
            icon={<Library size={20} />} 
            label="我的游戏库" 
          />
          <NavButton 
            active={currentView === 'history'} 
            onClick={() => setCurrentView('history')} 
            icon={<History size={20} />} 
            label="时光机" 
          />
          
          <div className="pt-6 mt-6 border-t border-slate-900/50">
            <NavButton 
              active={currentView === 'add'} 
              onClick={() => { setEditingGame(undefined); setCurrentView('add'); }} 
              icon={<PlusCircle size={20} />} 
              label="添加游戏" 
              variant="primary"
            />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-900/50 flex flex-col gap-4">
           <button 
             onClick={() => setShowSettings(true)}
             className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all group"
           >
             <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
             <span className="hidden lg:block font-medium text-sm">设置</span>
           </button>
           
           <div className="hidden lg:flex items-center justify-center gap-2 text-xs text-slate-600">
             <Ghost size={12} />
             <span>v1.6.0 &bull; 离线可用</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 overflow-y-auto min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050910] to-[#050910]">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 pb-6 border-b border-slate-900/60 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {currentView === 'add' ? (editingGame ? '编辑记录' : '添加新游戏') : 
               currentView === 'dashboard' ? '游玩数据' : 
               currentView === 'history' ? '游戏生涯' : '游戏收藏'}
            </h2>
            <p className="text-slate-400 mt-2 text-sm font-medium">
              {currentView === 'dashboard' && '查看您的游戏生涯统计与偏好分析。'}
              {currentView === 'library' && `当前共收藏 ${games.length} 款游戏。`}
              {currentView === 'history' && '按时间线回顾您的游玩轨迹与时长。'}
              {currentView === 'add' && '记录每一次冒险的开始。'}
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && <StatsView games={games} />}
          {currentView === 'library' && (
            <GameLibrary 
              games={games} 
              onDelete={handleDeleteGame} 
              onEdit={handleEditGame} 
              onImport={handleImportGames}
            />
          )}
          {currentView === 'history' && <TimelineView games={games} />}
          {currentView === 'add' && (
            <GameForm 
              onSave={handleSaveGame} 
              onCancel={() => { setEditingGame(undefined); setCurrentView('library'); }}
              initialData={editingGame}
            />
          )}
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, variant = 'default' }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
      ${variant === 'primary' 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:scale-[1.02]' 
        : active 
          ? 'bg-slate-800/80 text-white shadow-inner border border-slate-700/50' 
          : 'text-slate-400 hover:bg-slate-900 hover:text-indigo-200'
      }
    `}
  >
    <span className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="hidden lg:block font-medium text-sm relative z-10">{label}</span>
    
    {/* Active Indicator */}
    {active && variant !== 'primary' && (
       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"></div>
    )}
  </button>
);

export default App;
