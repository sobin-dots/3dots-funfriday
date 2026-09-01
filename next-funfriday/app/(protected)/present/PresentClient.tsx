'use client';

import ScoreBoard from '@/components/shared/ScoreBoard';
import { useGameState } from '../../../hooks/useGameState';
import { GAME_PHASES } from '../../../constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Brain, Palette, Puzzle, Users, CheckCircle2, XCircle, Trophy } from 'lucide-react';

export default function PresentClient() {
    const { gameState } = useGameState(true);

    if (!gameState) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <Card className="text-center p-16 border-dashed border-2 border-border/50 bg-card/30 max-w-2xl w-full">
                    <CardContent className="pt-6 text-muted-foreground text-2xl flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading game state...
                    </CardContent>
                </Card>
            </div>
        );
    }

    const onlineCount = Object.values(gameState.members).filter((m) => m.connected).length;

    const renderAuction = () => {
        const activeItem = gameState.auction.items.find((i: { no: number }) => i.no === gameState.auction.activeItemId);
        if (!activeItem) {
            return (
                <Card className="text-center p-16 border-dashed border-2 border-indigo-500/30 bg-indigo-500/5">
                    <CardContent className="pt-6 text-muted-foreground text-3xl flex flex-col items-center gap-6">
                        <Tag className="w-20 h-20 text-indigo-400 opacity-50" />
                        <div>
                            <div className="text-white font-bold mb-2">Productivity Auction</div>
                            <div className="text-2xl opacity-70">Next item coming up</div>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        return (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-center gap-4 text-4xl font-black text-indigo-400 drop-shadow-md">
                    <Tag className="w-10 h-10" /> Productivity Auction  Item #{activeItem.no}
                </div>
                <Card className="border-indigo-500/30 shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 p-16 text-center">
                            <div className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">{activeItem.name}</div>
                            <div className="text-3xl text-yellow-400 italic mb-12">&quot;{activeItem.why}&quot;</div>
                            <div className="text-8xl md:text-9xl font-black text-white mb-6 drop-shadow-2xl">{activeItem.currentBid} <span className="text-4xl text-indigo-300">pts</span></div>
                            <div className="text-2xl text-indigo-200 font-medium bg-indigo-950/50 inline-block px-8 py-4 rounded-full border border-indigo-500/30">
                                {activeItem.currentBidderId ? ' Top bid placed' : 'Waiting for the first bid'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderMyth = () => {
        const activeStatement = gameState.myth.statements.find((s: { no: number }) => s.no === gameState.myth.activeStatementId);
        if (!activeStatement) {
            return (
                <Card className="text-center p-16 border-dashed border-2 border-purple-500/30 bg-purple-500/5">
                    <CardContent className="pt-6 text-muted-foreground text-3xl flex flex-col items-center gap-6">
                        <Brain className="w-20 h-20 text-purple-400 opacity-50" />
                        <div>
                            <div className="text-white font-bold mb-2">Myth Buster</div>
                            <div className="text-2xl opacity-70">Next statement coming up</div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const trueVotesCount = Object.values(activeStatement.votes as Record<string, string>).filter(v => v === 'True').length;
        const falseVotesCount = Object.values(activeStatement.votes as Record<string, string>).filter(v => v === 'False').length;
        const totalVotes = trueVotesCount + falseVotesCount;
        const truePercentage = totalVotes ? Math.round((trueVotesCount / totalVotes) * 100) : 0;
        const falsePercentage = totalVotes ? 100 - truePercentage : 0;

        return (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-center gap-4 text-4xl font-black text-purple-400 drop-shadow-md">
                    <Brain className="w-10 h-10" /> Myth Buster  Statement #{activeStatement.no}
                </div>
                <Card className="border-purple-500/30 shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardContent className="p-12 space-y-12">
                        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-3xl p-12 shadow-inner text-center">
                            <div className="text-5xl md:text-6xl font-bold text-white leading-tight">{activeStatement.text}</div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex h-16 rounded-full overflow-hidden border-2 border-border/50 shadow-inner bg-background/50">
                                <div className="flex items-center justify-center bg-emerald-500 text-emerald-950 font-black text-2xl transition-all duration-1000 ease-out" style={{ width: `${truePercentage}%` }}>
                                    {trueVotesCount > 0 ? `TRUE ${truePercentage}%` : ''}
                                </div>
                                <div className="flex items-center justify-center bg-red-500 text-red-950 font-black text-2xl transition-all duration-1000 ease-out" style={{ width: `${falsePercentage}%` }}>
                                    {falseVotesCount > 0 ? `FALSE ${falsePercentage}%` : ''}
                                </div>
                            </div>
                            <div className="flex justify-between px-4 text-2xl font-bold">
                                <span className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-8 h-8" /> {trueVotesCount} votes</span>
                                <span className="text-muted-foreground">{totalVotes} total votes</span>
                                <span className="text-red-400 flex items-center gap-2">{falseVotesCount} votes <XCircle className="w-8 h-8" /></span>
                            </div>
                        </div>

                        {activeStatement.revealed && (
                            <div className={`p-10 rounded-3xl border-4 animate-in slide-in-from-bottom-10 fade-in duration-700 ${activeStatement.answer === 'True' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                                <div className={`font-black text-5xl mb-6 flex items-center justify-center gap-4 ${activeStatement.answer === 'True' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {activeStatement.answer === 'True' ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                                    Answer: {activeStatement.answer.toUpperCase()}
                                </div>
                                <div className="text-3xl text-muted-foreground leading-relaxed text-center">{activeStatement.explanation}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderLogo = () => {
        const activeLogo = gameState.logo.items.find((i: { no: number }) => i.no === gameState.logo.activeLogoId);
        if (!activeLogo) {
            return (
                <Card className="text-center p-16 border-dashed border-2 border-pink-500/30 bg-pink-500/5">
                    <CardContent className="pt-6 text-muted-foreground text-3xl flex flex-col items-center gap-6">
                        <Palette className="w-20 h-20 text-pink-400 opacity-50" />
                        <div>
                            <div className="text-white font-bold mb-2">Old Logo Finder</div>
                            <div className="text-2xl opacity-70">Next logo coming up</div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-center gap-4 text-4xl font-black text-pink-400 drop-shadow-md">
                    <Palette className="w-10 h-10" /> Old Logo Finder  Logo #{activeLogo.no}
                </div>
                <Card className="border-pink-500/30 shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardContent className="p-12 flex flex-col items-center">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[3rem] p-12 shadow-2xl mb-10 w-full max-w-2xl flex items-center justify-center aspect-square relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={activeLogo.svg} alt="Vintage Logo" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                        </div>
                        <p className="text-pink-300 italic text-4xl mb-12 text-center font-medium">&quot;{activeLogo.hint}&quot;</p>

                        {!activeLogo.revealed ? (
                            <div className="w-full space-y-8">
                                <div className="grid grid-cols-2 gap-6 w-full">
                                    {activeLogo.options.map((opt: string) => (
                                        <div key={opt} className="flex items-center justify-center h-24 rounded-2xl text-3xl font-bold border-4 border-border/50 bg-background/50 text-muted-foreground">
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center text-3xl text-muted-foreground font-medium bg-background/50 py-6 rounded-full border border-border/50">
                                    <span className="text-pink-400 font-bold">{activeLogo.totalVotes}</span> votes submitted
                                </div>
                            </div>
                        ) : (
                            <div className="w-full space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
                                <div className="grid grid-cols-2 gap-6 w-full">
                                    {activeLogo.options.map((opt: string) => {
                                        const isCorrectAnswer = opt === activeLogo.answer;
                                        return (
                                            <div key={opt} className={`flex items-center justify-center h-24 rounded-2xl text-3xl font-bold border-4 transition-all ${isCorrectAnswer ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-105' : 'bg-background/30 border-border/30 text-muted-foreground opacity-30'}`}>
                                                {opt} {isCorrectAnswer && <CheckCircle2 className="w-8 h-8 ml-3" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-10 rounded-3xl border-4 bg-emerald-500/10 border-emerald-500/50 text-center">
                                    <div className="font-black text-5xl mb-6 flex items-center justify-center gap-4 text-emerald-400">
                                        <CheckCircle2 className="w-12 h-12" /> Correct brand: {activeLogo.answer}
                                    </div>
                                    <div className="text-3xl text-muted-foreground leading-relaxed">{activeLogo.explanation}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderConnection = () => {
        const activePuzzle = gameState.connection.puzzles.find((p: { no: number }) => p.no === gameState.connection.activePuzzleId);
        if (!activePuzzle) {
            return (
                <Card className="text-center p-16 border-dashed border-2 border-blue-500/30 bg-blue-500/5">
                    <CardContent className="pt-6 text-muted-foreground text-3xl flex flex-col items-center gap-6">
                        <Puzzle className="w-20 h-20 text-blue-400 opacity-50" />
                        <div>
                            <div className="text-white font-bold mb-2">Connection Game</div>
                            <div className="text-2xl opacity-70">Next puzzle coming up</div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const getCategoryColor = (level: string) => {
            switch (level) {
                case 'yellow': return 'bg-[#f9d854] text-[#2c2102] border-[#f9d854]';
                case 'green': return 'bg-[#60d394] text-[#04231a] border-[#60d394]';
                case 'blue': return 'bg-[#62b6cb] text-[#07232b] border-[#62b6cb]';
                case 'purple': return 'bg-[#b5838d] text-[#230811] border-[#b5838d]';
                default: return 'bg-indigo-500 text-white border-indigo-500';
            }
        };

        const revealedCategories = activePuzzle.categories.filter((c: { name: string }) => activePuzzle.revealedCategories.includes(c.name));
        const unrevealedWords = activePuzzle.categories
            .filter((c: { name: string }) => !activePuzzle.revealedCategories.includes(c.name))
            .flatMap((c: { words: string[] }) => c.words);

        return (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-center gap-4 text-4xl font-black text-blue-400 drop-shadow-md">
                    <Puzzle className="w-10 h-10" /> Connection  {activePuzzle.title}
                </div>
                <Card className="border-blue-500/30 shadow-2xl bg-card/80 backdrop-blur-xl">
                    <CardContent className="p-12 space-y-8">
                        {revealedCategories.length > 0 && (
                            <div className="space-y-4">
                                {revealedCategories.map((c: { name: string; level: string; words: string[] }) => (
                                    <div key={c.name} className={`p-8 rounded-2xl text-center shadow-lg animate-in zoom-in duration-500 ${getCategoryColor(c.level)}`}>
                                        <div className="font-black text-3xl uppercase tracking-widest mb-3">{c.name}</div>
                                        <div className="font-bold text-2xl opacity-90 tracking-wide">{c.words.join('  ')}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {unrevealedWords.length > 0 ? (
                            <div className="grid grid-cols-4 gap-4">
                                {unrevealedWords.map((word: string) => (
                                    <div key={word} className="flex items-center justify-center h-32 p-4 text-center font-black text-2xl uppercase tracking-wider rounded-2xl border-4 bg-background/80 border-border shadow-sm">
                                        {word}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 rounded-3xl border-4 bg-emerald-500/10 border-emerald-500/50 text-center animate-in fade-in duration-700">
                                <div className="font-black text-5xl flex flex-col items-center justify-center gap-6 text-emerald-400">
                                    <CheckCircle2 className="w-24 h-24" />
                                    Puzzle completely solved!
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 flex flex-col">
            <div className="flex items-center justify-between mb-12 bg-card/50 p-6 rounded-3xl border border-border/50 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Fun Friday</h1>
                        <div className="text-lg text-muted-foreground font-medium flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            {onlineCount} members connected
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="text-2xl px-6 py-2 border-indigo-500/30 bg-indigo-500/10 text-indigo-300 capitalize font-bold tracking-widest">
                    PHASE: {gameState.phase}
                </Badge>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto">
                {gameState.phase === GAME_PHASES.LOBBY && (
                    <Card className="text-center p-20 border-dashed border-2 border-border/50 bg-card/30">
                        <CardContent className="pt-6 text-muted-foreground flex flex-col items-center gap-8">
                            <Users className="w-32 h-32 text-indigo-400 opacity-20" />
                            <div className="text-5xl font-black text-white">Welcome to Fun Friday!</div>
                            <div className="text-3xl opacity-70">Scan the QR code or go to the link to join.</div>
                            <div className="mt-8 p-8 bg-background rounded-3xl border border-border/50 shadow-inner">
                                <div className="text-2xl font-bold mb-4 text-indigo-400">Waiting for facilitator to start...</div>
                                <div className="flex items-center justify-center gap-2 text-xl">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {onlineCount} players ready
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {gameState.phase === GAME_PHASES.AUCTION && renderAuction()}
                {gameState.phase === GAME_PHASES.MYTH && renderMyth()}
                {gameState.phase === GAME_PHASES.LOGO && renderLogo()}
                {gameState.phase === GAME_PHASES.CONNECTION && renderConnection()}
                {gameState.phase === GAME_PHASES.RESULTS && (
                    <div className="animate-in slide-in-from-bottom-10 fade-in duration-700">
                        <ScoreBoard members={gameState.members} />
                    </div>
                )}
            </div>
        </div>
    );
}
