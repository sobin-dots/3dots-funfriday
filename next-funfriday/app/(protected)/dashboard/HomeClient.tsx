'use client';

import { useState } from 'react';
import TopBar from './TopBar';
import AuctionView from './AuctionView';
import MythBusterView from './MythBusterView';
import LogoFinderView from './LogoFinderView';
import ConnectionsGrid from './ConnectionsGrid';
import ScoreBoard from '@/components/shared/ScoreBoard';
import PeopleView from './PeopleView';
import { useGameState } from '../../../hooks/useGameState';
import { SOCKET_EVENTS, GAME_PHASES, ROLES, GAME_STATUS } from '../../../constants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Tag, Brain, Palette, Puzzle, Users, CheckCircle2 } from 'lucide-react';

export default function HomeClient() {
    const {
        socket,
        gameState,
        role,
        memberId,
        handleLogout
    } = useGameState();

    const [adminTab, setAdminTab] = useState<string>('auction');

    // --- Render Helpers ---
    if (role === 'guest') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Authenticating...</div>
            </div>
        );
    }

    if (!gameState) {
        return <div className="wrap center" style={{ marginTop: '50px' }}>Loading game state...</div>;
    }

    const currentMember = gameState.members[memberId];
    const onlineCount = Object.values(gameState.members).filter((m: any) => m.connected).length;
    const totalJoined = Object.keys(gameState.members).length;

    return (
        <div className="wrap">
            <TopBar
                role={role}
                name={currentMember?.name}
                team={currentMember?.team}
                points={currentMember?.points}
                quizScore={currentMember?.quizScore}
                onlineCount={onlineCount}
                totalJoined={totalJoined}
                onLogout={handleLogout}
            />

            {role === 'admin' && (
                <Tabs value={adminTab} onValueChange={setAdminTab} className="w-full mb-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-card/50 p-2 rounded-xl border border-border/50 shadow-sm">
                        <TabsTrigger value="auction" className="gap-2 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"><Tag className="w-4 h-4" /> Auction</TabsTrigger>
                        <TabsTrigger value="myth" className="gap-2 py-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"><Brain className="w-4 h-4" /> Myth Buster</TabsTrigger>
                        <TabsTrigger value="logo" className="gap-2 py-2 data-[state=active]:bg-pink-500 data-[state=active]:text-white"><Palette className="w-4 h-4" /> Logo Finder</TabsTrigger>
                        <TabsTrigger value="connection" className="gap-2 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"><Puzzle className="w-4 h-4" /> Connection</TabsTrigger>
                        <TabsTrigger value="people" className="gap-2 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"><Users className="w-4 h-4" /> People</TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            {role === 'admin' && (
                <Card className="mb-6 border-indigo-500/20 shadow-sm bg-card/50">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                        <div className="font-medium"><b>Phase:</b> <span className="text-indigo-400 capitalize">{gameState.phase}</span></div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'lobby' })}>Lobby</Button>
                            <Button variant="outline" size="sm" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'auction' })}>Auction</Button>
                            <Button variant="outline" size="sm" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'myth' })}>Myth Buster</Button>
                            <Button variant="outline" size="sm" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'logo' })}>Logo Finder</Button>
                            <Button variant="outline" size="sm" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'connection' })}>Connection</Button>
                            <Button variant="outline" size="sm" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'results' })}>Results</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- Phase Routing --- */}
            {((role === 'member' && gameState.phase === 'auction') || (role === 'admin' && adminTab === 'auction')) && (
                <AuctionView
                    role={role}
                    auction={gameState.auction}
                    members={gameState.members}
                    memberPoints={currentMember?.points}
                    onBid={(amount) => socket.emit(SOCKET_EVENTS.AUCTION_BID, { amount }, (res: { ok: boolean; error?: string }) => { if (!res.ok) toast.error(res.error); else toast.success('Bid placed!'); })}
                    onOpenItem={(itemId) => socket.emit(SOCKET_EVENTS.AUCTION_OPEN, { itemId })}
                    onSell={() => socket.emit(SOCKET_EVENTS.AUCTION_SELL)}
                    onCancel={() => socket.emit(SOCKET_EVENTS.AUCTION_CANCEL)}
                    onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET, { what: 'auction' })}
                />
            )}

            {((role === 'member' && gameState.phase === 'myth') || (role === 'admin' && adminTab === 'myth')) && (
                <MythBusterView
                    role={role}
                    myth={gameState.myth}
                    memberId={memberId}
                    onVote={(vote) => socket.emit(SOCKET_EVENTS.MYTH_VOTE, { vote }, (res: { ok: boolean; error?: string }) => { if (!res.ok) toast.error(res.error); else toast.success('Vote recorded!'); })}
                    onOpen={(mythId) => socket.emit(SOCKET_EVENTS.MYTH_OPEN, { mythId })}
                    onReveal={() => socket.emit(SOCKET_EVENTS.MYTH_REVEAL)}
                    onClose={() => socket.emit(SOCKET_EVENTS.MYTH_CLOSE)}
                    onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET, { what: 'myth' })}
                />
            )}

            {((role === 'member' && gameState.phase === 'logo') || (role === 'admin' && adminTab === 'logo')) && (
                <LogoFinderView
                    role={role}
                    logo={gameState.logo}
                    memberId={memberId}
                    onVote={(vote) => socket.emit(SOCKET_EVENTS.LOGO_VOTE, { vote }, (res: { ok: boolean; error?: string }) => { if (!res.ok) toast.error(res.error); else toast.success('Guess submitted!'); })}
                    onOpen={(logoId) => socket.emit(SOCKET_EVENTS.LOGO_OPEN, { logoId })}
                    onReveal={() => socket.emit(SOCKET_EVENTS.LOGO_REVEAL)}
                    onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET, { what: 'logo' })}
                />
            )}

            {((role === 'member' && gameState.phase === 'connection') || (role === 'admin' && adminTab === 'connection')) && (
                <ConnectionsGrid
                    role={role}
                    connection={gameState.connection}
                    memberId={memberId}
                    onSubmit={(words) => socket.emit(SOCKET_EVENTS.CONNECTION_SUBMIT, { words }, (res: { ok: boolean; matched?: boolean; oneAway?: boolean; category?: string; error?: string }) => {
                        if (res.ok) {
                            if (res.matched) toast.success(`🎉 Group solved: ${res.category}! (+20 pts)`);
                            else if (res.oneAway) toast.warning('💡 One away! (3 of 4 match a category)');
                            else toast.error('❌ Not quite, try another combination.');
                        } else {
                            toast.error(res.error || 'Submission failed.');
                        }
                    })}
                    onOpen={(puzzleId) => socket.emit(SOCKET_EVENTS.CONNECTION_OPEN, { puzzleId })}
                    onRevealCategory={(categoryName) => socket.emit(SOCKET_EVENTS.CONNECTION_REVEAL_GROUP, { categoryName })}
                    onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET, { what: 'connection' })}
                />
            )}

            {role === 'admin' && adminTab === 'people' && (
                <PeopleView
                    members={gameState.members}
                    onKick={(id) => socket.emit(SOCKET_EVENTS.ADMIN_KICK, { memberId: id })}
                    onResetMembers={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET)}
                />
            )}

            {role === 'member' && gameState.phase === 'lobby' && (
                <Card className="text-center p-10 border-dashed border-2 border-border/50 bg-card/30">
                    <CardContent className="pt-6 text-muted-foreground text-lg">
                        🛋️ Hang tight! The facilitator will start the next game shortly.
                    </CardContent>
                </Card>
            )}

            {/* --- Scoreboard & Winnings --- */}
            {role === 'admin' && (
                <div className="mt-6">
                    <ScoreBoard members={gameState.members} />
                </div>
            )}

            {role === 'member' && currentMember?.wonItems?.length > 0 && (
                <Card className="mt-6 border-indigo-500/20 shadow-lg bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Tag className="w-5 h-5 text-indigo-400" /> Your winnings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentMember.wonItems.map((itemNo: number) => {
                            const item = gameState.auction.items.find((i: any) => i.no === itemNo);
                            return (
                                <div key={itemNo} className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3">
                                    <div className="font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {item?.name}</div>
                                    <div className="flex flex-wrap sm:flex-nowrap gap-3">
                                        <Input
                                            className="flex-1 bg-background"
                                            type="text"
                                            maxLength={240}
                                            placeholder="Why do you want this? (optional)"
                                            defaultValue={item?.reason || ''}
                                            onBlur={(e) => {
                                                socket.emit(SOCKET_EVENTS.AUCTION_REASON, { itemId: itemNo, reason: e.target.value });
                                                toast.success('Reason saved automatically');
                                            }}
                                        />
                                        <Button variant="secondary" size="sm" disabled className="opacity-70">Saved automatically</Button>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
