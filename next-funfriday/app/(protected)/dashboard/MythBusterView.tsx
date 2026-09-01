'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, XCircle, Eye, RotateCcw, ArrowRight } from 'lucide-react';
import { useMythVote } from '@/hooks/queries/useGameMutations';

interface MythStatement {
    id: string;
    no: number;
    text: string;
    answer: string;
    explanation: string;
    status: 'pending' | 'active' | 'completed';
    revealed: boolean;
    totalVotes: number;
    votes: Record<string, string>; // memberId -> 'True' | 'False'
}

interface MythState {
    activeStatementId: number | null;
    statements: MythStatement[];
}

import { ROLES, GAME_STATUS } from '../../../constants';

interface MythBusterViewProps {
    role: typeof ROLES[keyof typeof ROLES];
    myth: MythState;
    memberId?: string;
    onOpen?: (mythId: number) => void;
    onReveal?: () => void;
    onClose?: () => void;
    onReset?: () => void;
}

export default function MythBusterView({
    role,
    myth,
    memberId,
    onOpen,
    onReveal,
    onClose,
    onReset
}: MythBusterViewProps) {
    const mythVoteMutation = useMythVote();
    const activeStatement = myth.statements.find((s) => s.no === myth.activeStatementId);

    const renderVoteBar = (statement: MythStatement) => {
        const trueVotes = Object.values(statement.votes).filter(v => v === 'True').length;
        const falseVotes = Object.values(statement.votes).filter(v => v === 'False').length;
        const total = trueVotes + falseVotes;
        const tp = total ? Math.round((trueVotes / total) * 100) : 0;
        const fp = total ? 100 - tp : 0;

        return (
            <div className="mt-4">
                <div className="flex h-8 rounded-full overflow-hidden border border-border/50 shadow-inner bg-background/50">
                    <div className="flex items-center justify-center bg-emerald-500 text-emerald-950 font-bold text-xs transition-all duration-500" style={{ width: `${tp}%` }}>
                        {trueVotes > 0 ? `TRUE ${tp}%` : ''}
                    </div>
                    <div className="flex items-center justify-center bg-red-500 text-red-950 font-bold text-xs transition-all duration-500" style={{ width: `${fp}%` }}>
                        {falseVotes > 0 ? `FALSE ${fp}%` : ''}
                    </div>
                </div>
                <p className="text-center text-muted-foreground text-sm mt-2 font-medium">
                    <span className="text-emerald-400"> {trueVotes}</span> &nbsp;  &nbsp; <span className="text-red-400"> {falseVotes}</span>
                </p>
            </div>
        );
    };

    if (role === ROLES.MEMBER) {
        if (!activeStatement) {
            return (
                <Card className="text-center p-10 border-dashed border-2 border-border/50 bg-card/30">
                    <CardContent className="pt-6 text-muted-foreground text-lg flex flex-col items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-400 opacity-50" />
                        Myth Buster is open. Waiting for the next statement
                    </CardContent>
                </Card>
            );
        }

        const myVote = memberId ? activeStatement.votes[memberId] : null;

        return (
            <div className="space-y-6">
                <Card className="border-purple-500/20 shadow-lg bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" /> Statement #{activeStatement.no}  Myth Buster
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-inner mb-6">
                            <div className="text-xl md:text-2xl font-bold text-white leading-relaxed">{activeStatement.text}</div>
                        </div>

                        {!activeStatement.revealed ? (
                            <div className="space-y-4">
                                <p className="text-center text-muted-foreground font-medium">Discuss with your team, then vote:</p>
                                <div className="flex gap-4">
                                    <Button
                                        size="lg"
                                        className={`flex-1 h-16 text-lg font-bold border-2 transition-all ${myVote === 'True' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'}`}
                                        onClick={() => mythVoteMutation.mutate('True')}
                                        disabled={mythVoteMutation.isPending}
                                    >
                                        <CheckCircle2 className="w-6 h-6 mr-2" /> TRUE {myVote === 'True' ? '' : ''}
                                    </Button>
                                    <Button
                                        size="lg"
                                        className={`flex-1 h-16 text-lg font-bold border-2 transition-all ${myVote === 'False' ? 'bg-red-500/20 text-red-400 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-red-600 hover:bg-red-700 text-white border-transparent'}`}
                                        onClick={() => mythVoteMutation.mutate('False')}
                                        disabled={mythVoteMutation.isPending}
                                    >
                                        <XCircle className="w-6 h-6 mr-2" /> FALSE {myVote === 'False' ? '' : ''}
                                    </Button>
                                </div>
                                {myVote ? (
                                    <p className="text-center text-sm">
                                        You voted <b className={myVote === 'True' ? 'text-emerald-400' : 'text-red-400'}>{myVote}</b>. You can change it until the answer is revealed.
                                    </p>
                                ) : (
                                    <p className="text-center text-muted-foreground text-sm">No vote yet.</p>
                                )}
                                <p className="text-center text-muted-foreground text-sm">{activeStatement.totalVotes} vote(s) in so far.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {renderVoteBar(activeStatement)}
                                <div className={`p-5 rounded-xl border ${activeStatement.answer === 'True' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                                    <div className={`font-bold mb-2 flex items-center gap-2 ${activeStatement.answer === 'True' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {activeStatement.answer === 'True' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        Correct answer: {activeStatement.answer.toUpperCase()}
                                    </div>
                                    <div className="text-muted-foreground leading-relaxed">{activeStatement.explanation}</div>
                                </div>
                                <div className="text-center font-medium text-lg">
                                    {myVote ? (
                                        myVote === activeStatement.answer ? (
                                            <span className="text-emerald-400 flex items-center justify-center gap-2"> You were right! +10 quiz points</span>
                                        ) : (
                                            <span className="text-red-400 flex items-center justify-center gap-2">You voted {myVote}  not this time.</span>
                                        )
                                    ) : (
                                        <span className="text-muted-foreground">You didn&apos;t vote on this one.</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Past Quizzes Section for Members */}
                {myth.statements.filter(s => s.status === GAME_STATUS.COMPLETED).length > 0 && (
                    <div className="mt-8 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-muted-foreground">
                            <RotateCcw className="w-5 h-5" /> Past Quizzes
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {myth.statements.filter(s => s.status === GAME_STATUS.COMPLETED).map((s) => {
                                const pastVote = memberId ? s.votes[memberId] : null;
                                const isCorrect = pastVote === s.answer;
                                return (
                                    <Card key={s.id} className="border-border/50 bg-card/30 opacity-80">
                                        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex-1">
                                                <div className="font-bold text-sm mb-1">#{s.no} {s.text}</div>
                                                <div className="text-xs text-muted-foreground">{s.explanation}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 min-w-[120px]">
                                                <Badge variant="outline" className={s.answer === 'True' ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}>
                                                    Answer: {s.answer.toUpperCase()}
                                                </Badge>
                                                {pastVote && (
                                                    <div className={`text-xs font-medium flex items-center gap-1 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        You voted: {pastVote}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Admin View
    return (
        <div className="space-y-6">
            {activeStatement && (
                <Card className="border-red-500/30 shadow-lg bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-400">
                            <span className="relative flex h-3 w-3 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Live now  Statement #{activeStatement.no}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-inner">
                            <div className="text-xl font-bold text-white leading-relaxed">{activeStatement.text}</div>
                        </div>

                        {renderVoteBar(activeStatement)}

                        <div className={`p-4 rounded-xl border ${activeStatement.revealed ? (activeStatement.answer === 'True' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50') : 'bg-background/50 border-border/50 opacity-60'}`}>
                            <div className="font-bold mb-1 flex items-center gap-2">
                                {activeStatement.revealed ? <CheckCircle2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {activeStatement.revealed ? 'Revealed  ' : 'Answer (hidden from members): '}
                                <span className={activeStatement.answer === 'True' ? 'text-emerald-400' : 'text-red-400'}>{activeStatement.answer.toUpperCase()}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{activeStatement.explanation}</div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-3">
                            <Button
                                size="lg"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                disabled={activeStatement.revealed}
                                onClick={onReveal}
                            >
                                <Eye className="w-5 h-5 mr-2" /> Reveal answer & award points
                            </Button>
                            {activeStatement.revealed && (
                                <Button
                                    size="lg"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    <XCircle className="w-5 h-5 mr-2" /> Close Question
                                </Button>
                            )}
                            {activeStatement.no < myth.statements.length && (
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => onOpen && onOpen(activeStatement.no + 1)}
                                >
                                    Next <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-purple-500/20 shadow-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Brain className="w-5 h-5 text-purple-400" /> Statements
                    </CardTitle>
                    <Button variant="destructive" size="sm" onClick={onReset} className="h-8">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset quiz
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {myth.statements.map((s) => (
                            <div key={s.id} className={`flex flex-col gap-3 p-4 rounded-xl border ${s.status === GAME_STATUS.ACTIVE ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-border/50 bg-background/50'} ${s.status === GAME_STATUS.COMPLETED ? 'opacity-60' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-muted-foreground">#{s.no}</span>
                                    <Badge variant={s.status === GAME_STATUS.ACTIVE ? 'default' : s.status === GAME_STATUS.COMPLETED ? 'secondary' : 'outline'} className={s.status === GAME_STATUS.ACTIVE ? 'bg-purple-500' : s.status === GAME_STATUS.COMPLETED ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                        {s.status}
                                    </Badge>
                                </div>
                                <div className="font-bold text-sm leading-relaxed flex-1">{s.text}</div>

                                <div className="pt-3 mt-auto border-t border-border/50 flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground font-medium">
                                        {s.totalVotes} votes
                                    </div>
                                    <Button
                                        variant={s.status === GAME_STATUS.ACTIVE ? 'secondary' : 'outline'}
                                        size="sm"
                                        onClick={() => onOpen && onOpen(s.no)}
                                    >
                                        {s.status === GAME_STATUS.ACTIVE ? 'Re-open' : 'Open question'}
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
