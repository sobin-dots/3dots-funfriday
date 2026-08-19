'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, CheckCircle2, Eye, RotateCcw, ArrowRight, Filter } from 'lucide-react';

interface LogoItem {
    id: string;
    no: number;
    level: 'easy' | 'medium' | 'hard';
    svg: string;
    hint: string;
    answer: string;
    options: string[];
    explanation: string;
    status: 'pending' | 'active' | 'revealed';
    revealed: boolean;
    totalVotes: number;
    votes: Record<string, string>; // memberId -> guess
}

interface LogoState {
    activeLogoId: number | null;
    items: LogoItem[];
}

interface LogoFinderViewProps {
    role: 'member' | 'admin';
    logo: LogoState;
    memberId?: string;
    onVote?: (guess: string) => void;
    onOpen?: (logoId: number) => void;
    onReveal?: () => void;
    onReset?: () => void;
}

export default function LogoFinderView({
    role,
    logo,
    memberId,
    onVote,
    onOpen,
    onReveal,
    onReset
}: LogoFinderViewProps) {
    const [levelFilter, setLevelFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

    const activeLogo = logo.items.find((l) => l.no === logo.activeLogoId);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'easy': return 'bg-emerald-500 text-emerald-950 border-emerald-500';
            case 'medium': return 'bg-yellow-500 text-yellow-950 border-yellow-500';
            case 'hard': return 'bg-red-500 text-red-950 border-red-500';
            default: return 'bg-indigo-500 text-white border-indigo-500';
        }
    };

    if (role === 'member') {
        if (!activeLogo) {
            return (
                <Card className="text-center p-10 border-dashed border-2 border-border/50 bg-card/30">
                    <CardContent className="pt-6 text-muted-foreground text-lg flex flex-col items-center gap-3">
                        <Palette className="w-8 h-8 text-pink-400 opacity-50" />
                        Old Logo Finder is open. Waiting for the facilitator to open a logo
                    </CardContent>
                </Card>
            );
        }

        const myVote = memberId ? activeLogo.votes[memberId] : null;

        return (
            <Card className="border-pink-500/20 shadow-lg bg-card/50">
                <CardHeader>
                    <CardTitle className="text-muted-foreground text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-pink-400" /> Logo #{activeLogo.no}  Famous Brands
                        </div>
                        <Badge className={`${getLevelColor(activeLogo.level)} font-bold`}>{activeLogo.level.toUpperCase()}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl mb-6 w-full max-w-md flex items-center justify-center aspect-square relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeLogo.svg} alt="Vintage Logo" className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <p className="text-pink-300 italic text-lg mb-8 text-center font-medium">&quot;{activeLogo.hint}&quot;</p>

                    {!activeLogo.revealed ? (
                        <div className="w-full space-y-6">
                            <p className="text-center text-muted-foreground font-medium">Which famous brand used this logo?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                {activeLogo.options.map((opt) => (
                                    <Button
                                        key={opt}
                                        size="lg"
                                        variant={myVote === opt ? 'default' : 'outline'}
                                        className={`h-16 text-lg font-bold border-2 transition-all ${myVote === opt ? 'bg-pink-600 hover:bg-pink-700 text-white border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'border-border/50 hover:border-pink-500/50 hover:bg-pink-500/10'}`}
                                        onClick={() => onVote && onVote(opt)}
                                    >
                                        {opt} {myVote === opt && <CheckCircle2 className="w-5 h-5 ml-2" />}
                                    </Button>
                                ))}
                            </div>
                            <div className="text-center space-y-1">
                                {myVote ? (
                                    <p className="text-sm">Your guess: <b className="text-pink-400">{myVote}</b></p>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Select an option to place your guess.</p>
                                )}
                                <p className="text-muted-foreground text-xs">{activeLogo.totalVotes} vote(s) submitted.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                {activeLogo.options.map((opt) => {
                                    const isAns = opt === activeLogo.answer;
                                    const isMyVote = opt === myVote;
                                    return (
                                        <div
                                            key={opt}
                                            className={`flex items-center justify-center h-16 rounded-xl text-lg font-bold border-2 transition-all ${isAns ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : isMyVote ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-background/30 border-border/30 text-muted-foreground opacity-50'}`}
                                        >
                                            {opt} {isAns && <CheckCircle2 className="w-5 h-5 ml-2" />}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-5 rounded-xl border bg-emerald-500/10 border-emerald-500/50 text-center">
                                <div className="font-bold mb-2 flex items-center justify-center gap-2 text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" /> Correct brand: {activeLogo.answer}
                                </div>
                                <div className="text-muted-foreground text-sm leading-relaxed">{activeLogo.explanation}</div>
                            </div>
                            <div className="text-center font-medium text-lg">
                                {myVote ? (
                                    myVote === activeLogo.answer ? (
                                        <span className="text-emerald-400 flex items-center justify-center gap-2"> You got it! +10 quiz points</span>
                                    ) : (
                                        <span className="text-red-400 flex items-center justify-center gap-2">You guessed {myVote}  not quite.</span>
                                    )
                                ) : (
                                    <span className="text-muted-foreground">You didn&apos;t guess on this one.</span>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Admin View
    const filteredItems = levelFilter === 'all' ? logo.items : logo.items.filter(i => i.level === levelFilter);

    return (
        <div className="space-y-6">
            {activeLogo && (
                <Card className="border-red-500/30 shadow-lg bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-red-400">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Live now  Logo #{activeLogo.no}
                            </div>
                            <Badge className={`${getLevelColor(activeLogo.level)} font-bold`}>{activeLogo.level.toUpperCase()}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl w-full max-w-xs flex items-center justify-center aspect-square relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={activeLogo.svg} alt="Vintage Logo" className="max-w-full max-h-full object-contain drop-shadow-xl" />
                        </div>
                        <p className="text-pink-300 italic text-center font-medium">&quot;{activeLogo.hint}&quot;</p>

                        <div className="w-full grid grid-cols-2 gap-2 text-sm text-muted-foreground text-center">
                            {activeLogo.options.map(opt => (
                                <div key={opt} className={`p-2 rounded-lg border ${opt === activeLogo.answer ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 font-bold' : 'border-border/50 bg-background/50'}`}>
                                    {opt}
                                </div>
                            ))}
                        </div>

                        <div className={`w-full p-4 rounded-xl border ${activeLogo.revealed ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-background/50 border-border/50 opacity-60'}`}>
                            <div className="font-bold mb-1 flex items-center gap-2">
                                {activeLogo.revealed ? <CheckCircle2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {activeLogo.revealed ? 'Revealed  ' : 'Answer (hidden from members): '}
                                <span className="text-emerald-400">{activeLogo.answer}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{activeLogo.explanation}</div>
                        </div>

                        <div className="w-full flex flex-wrap sm:flex-nowrap gap-3">
                            <Button
                                size="lg"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                disabled={activeLogo.revealed}
                                onClick={onReveal}
                            >
                                <Eye className="w-5 h-5 mr-2" /> Reveal answer & award points
                            </Button>
                            {activeLogo.no < logo.items.length && (
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => onOpen && onOpen(activeLogo.no + 1)}
                                >
                                    Next <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-pink-500/20 shadow-sm bg-card/50">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Palette className="w-5 h-5 text-pink-400" /> Logo Library
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-background/50 rounded-lg p-1 border border-border/50">
                            {(['all', 'easy', 'medium', 'hard'] as const).map((lvl) => (
                                <Button
                                    key={lvl}
                                    variant={levelFilter === lvl ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={`h-7 px-3 text-xs capitalize ${levelFilter === lvl ? 'shadow-sm' : ''}`}
                                    onClick={() => setLevelFilter(lvl)}
                                >
                                    {lvl === 'all' && <Filter className="w-3 h-3 mr-1" />}
                                    {lvl}
                                </Button>
                            ))}
                        </div>
                        <Button variant="destructive" size="sm" onClick={onReset} className="h-9">
                            <RotateCcw className="w-4 h-4 mr-1" /> Reset
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map((l) => (
                            <div key={l.id} className={`flex flex-col gap-3 p-4 rounded-xl border ${l.status === 'active' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'border-border/50 bg-background/50'} ${l.status === 'revealed' ? 'opacity-60' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-muted-foreground">#{l.no}</span>
                                    <Badge className={`${getLevelColor(l.level)} text-[10px] px-1.5 py-0 h-5`}>{l.level.toUpperCase()}</Badge>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 flex items-center justify-center h-24 border border-white/10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={l.svg} alt="Logo" className="max-w-full max-h-full object-contain opacity-80" />
                                </div>
                                <div className="text-center font-bold text-sm text-emerald-400">{l.answer}</div>

                                <div className="pt-3 mt-auto border-t border-border/50 flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground font-medium">
                                        {l.totalVotes} votes
                                    </div>
                                    <Button
                                        variant={l.status === 'active' ? 'secondary' : 'outline'}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => onOpen && onOpen(l.no)}
                                    >
                                        {l.status === 'active' ? 'Re-open' : 'Open'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
