import React from 'react';
import { 
  Gamepad2, 
  Monitor, 
  Smartphone, 
  Box, 
  Ghost, 
  Trophy, 
  Clock, 
  List, 
  XCircle,
  PlayCircle,
  CheckCircle,
  HelpCircle,
  Swords,
  History,
  CloudDownload,
  Loader2
} from 'lucide-react';
import { PlayStatus } from '../types';

export const PlatformIcon = ({ platform, className = "w-4 h-4" }: { platform: string, className?: string }) => {
  const p = platform.toLowerCase();
  if (p.includes('pc') || p.includes('steam') || p.includes('epic') || p.includes('电脑')) return <Monitor className={className} />;
  if (p.includes('mobile') || p.includes('ios') || p.includes('android') || p.includes('手游')) return <Smartphone className={className} />;
  if (p.includes('retro') || p.includes('怀旧') || p.includes('模拟器')) return <Ghost className={className} />;
  if (p.includes('xbox')) return <Box className={className} />; 
  // Default gamepad for consoles (PS/Switch/Other)
  return <Gamepad2 className={className} />;
};

export const StatusIcon = ({ status, className = "w-4 h-4" }: { status: PlayStatus, className?: string }) => {
  switch (status) {
    case 'Playing': return <PlayCircle className={`${className} text-cyan-400`} />;
    case 'Completed': return <Trophy className={`${className} text-yellow-400`} />;
    case 'Backlog': return <List className={`${className} text-slate-400`} />;
    case 'Dropped': return <XCircle className={`${className} text-red-500`} />;
    case 'Wishlist': return <HelpCircle className={`${className} text-purple-400`} />;
    default: return <Gamepad2 className={className} />;
  }
};

export { History, CloudDownload, Loader2 };