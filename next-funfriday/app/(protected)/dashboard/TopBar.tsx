'use client';

import { Settings, Users, MonitorPlay, PartyPopper, Coins, Brain, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
    role: 'member' | 'admin';
    name?: string;
    team?: string;
    points?: number;
    quizScore?: number;
    onlineCount?: number;
    totalJoined?: number;
    onLogout?: () => void;
}

export default function TopBar({
    role,
    name,
    team,
    points = 0,
    quizScore = 0,
    onlineCount = 0,
    totalJoined = 0,
    onLogout
}: TopBarProps) {
    if (role === 'admin') {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg text-white">
                <div className="flex items-center gap-2 font-extrabold text-lg tracking-wide">
                    <Settings className="w-5 h-5" /> Fun Friday — Control Panel
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3 bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Users className="w-4 h-4" /> <b>{onlineCount}</b> online
                    </Badge>
                    <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3 bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Users className="w-4 h-4" /> <b>{totalJoined}</b> joined
                    </Badge>
                    <a href="/present" target="_blank" rel="noopener">
                        <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3 bg-white/20 hover:bg-white/30 text-white border-white/30 cursor-pointer">
                            <MonitorPlay className="w-4 h-4" /> Projector
                        </Badge>
                    </a>
                    <Button variant="ghost" size="sm" onClick={onLogout} className="h-7 px-3 text-xs font-bold text-white hover:bg-white/20 hover:text-white rounded-full">
                        <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg text-white">
            <div className="flex items-center gap-2 font-extrabold text-lg tracking-wide">
                <PartyPopper className="w-5 h-5" /> Fun Friday
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3 bg-white/20 hover:bg-white/30 text-white border-white/30">
                    {name} <span className="text-white/70 font-normal">· {team}</span>
                </Badge>
                <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3 bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Coins className="w-4 h-4 text-yellow-300" /> <b>{points}</b> pts
                </Badge>
                <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3 bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Brain className="w-4 h-4 text-pink-300" /> <b>{quizScore}</b> quiz
                </Badge>
                <Button variant="ghost" size="sm" onClick={onLogout} className="h-7 px-3 text-xs font-bold text-white hover:bg-white/20 hover:text-white rounded-full">
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Leave
                </Button>
            </div>
        </div>
    );
}
