'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tag, RotateCcw, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { toast } from 'sonner';

interface AuctionItem {
    id: string;
    no: number;
    name: string;
    why: string;
    status: 'pending' | 'active' | 'sold';
    currentBid: number;
    currentBidderId: string | null;
    winnerId: string | null;
    winningBid: number;
    reason: string | null;
}

interface AuctionState {
    activeItemId: number | null;
    items: AuctionItem[];
}

interface MemberData {
    id: string;
    name: string;
    team: string;
    points: number;
}

import { ROLES, GAME_STATUS } from '../../../constants';

interface AuctionViewProps {
    role: typeof ROLES[keyof typeof ROLES];
    auction: AuctionState;
    members?: Record<string, MemberData>;
    memberPoints?: number;
    onBid?: (amount: number) => void;
    onOpenItem?: (itemId: number) => void;
    onSell?: () => void;
    onCancel?: () => void;
    onReset?: () => void;
}

export default function AuctionView({
    role,
    auction,
    members,
    memberPoints = 0,
    onBid,
    onOpenItem,
    onSell,
    onCancel,
    onReset
}: AuctionViewProps) {
    const [bidAmount, setBidAmount] = useState<string>('');
    const activeItem = auction.items.find((item) => item.no === auction.activeItemId);

    const topBidder = activeItem?.currentBidderId && members ? members[activeItem.currentBidderId] : null;
    const topBidderName = topBidder?.name;
    const [topBidderFirstName] = topBidderName ? topBidderName.split(' ') : [''];

    const handlePlaceBid = () => {
        if (!bidAmount) {
            toast.error("Please enter a bid amount");
            return;
        }
        if (onBid) {
            onBid(Number(bidAmount));
            setBidAmount(''); // Clear input after bid
        }
    };

    if (role === ROLES.MEMBER) {
        if (!activeItem) {
            return (
                <Card className="text-center p-10 border-dashed border-2 border-border/50 bg-card/30">
                    <CardContent className="pt-6 text-muted-foreground text-lg flex flex-col items-center gap-3">
                        <Tag className="w-8 h-8 text-indigo-400 opacity-50" />
                        Auction is open. Waiting for the facilitator to put up the next item…
                    </CardContent>
                </Card>
            );
        }

        const canBid = activeItem.status === GAME_STATUS.ACTIVE;

        return (
            <Card className="border-indigo-500/20 shadow-lg bg-card/50">
                <CardContent className="p-6">
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-8 text-center shadow-inner">
                        <div className="text-indigo-300 font-bold tracking-widest text-sm mb-2">ITEM #{activeItem.no}</div>
                        <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">{activeItem.name}</div>
                        <div className="text-yellow-400 italic mb-6">{activeItem.why}</div>
                        <div className="text-5xl md:text-6xl font-black text-white mb-2 drop-shadow-md">{activeItem.currentBid} <span className="text-2xl text-indigo-300">pts</span></div>
                        <div className="text-muted-foreground font-medium">
                            {activeItem.currentBidderId ? `🔥 Top bid by ${topBidderName}` : 'No bids yet — start it off!'}
                        </div>
                    </div>

                    {canBid ? (
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-wrap sm:flex-nowrap gap-3">
                                <Input
                                    className="flex-1 text-lg py-6 bg-background/50 border-indigo-500/30 focus-visible:ring-indigo-500"
                                    id="bid-amount"
                                    type="number"
                                    min={activeItem.currentBid + 1}
                                    max={memberPoints}
                                    placeholder={`Your bid (max ${memberPoints})`}
                                    value={bidAmount}
                                    onChange={(event) => setBidAmount(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && canBid) {
                                            handlePlaceBid();
                                        }
                                    }}
                                />
                                <Button size="lg" className="py-6 px-8 text-lg font-bold bg-indigo-600 hover:bg-indigo-700" onClick={handlePlaceBid}>
                                    Place bid
                                </Button>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {[5, 10, 20].map((step) => {
                                    const nextBid = activeItem.currentBid + step;
                                    if (nextBid <= memberPoints) {
                                        return (
                                            <Button
                                                key={step}
                                                variant="outline"
                                                className="border-indigo-500/30 hover:bg-indigo-500/20"
                                                onClick={() => onBid && onBid(nextBid)}
                                            >
                                                +{step} → {nextBid}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })}
                                {memberPoints > activeItem.currentBid && (
                                    <Button
                                        variant="destructive"
                                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                        onClick={() => onBid && onBid(memberPoints)}
                                    >
                                        All in ({memberPoints})
                                    </Button>
                                )}
                            </div>
                            <p className="text-center text-muted-foreground text-sm">
                                You have <b className="text-white">{memberPoints}</b> points to spend.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 text-center text-muted-foreground p-4 bg-background/30 rounded-xl border border-border/50">
                            This item is closed.
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Admin View
    return (
        <div className="space-y-6">
            {activeItem && (
                <Card className="border-red-500/30 shadow-lg bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-400">
                            <span className="relative flex h-3 w-3 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Live now — Item #{activeItem.no}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 text-center shadow-inner mb-4">
                            <div className="text-2xl font-extrabold text-white mb-1">{activeItem.name}</div>
                            <div className="text-yellow-400 italic mb-4">{activeItem.why}</div>
                            <div className="text-4xl font-black text-white mb-1">{activeItem.currentBid} <span className="text-xl text-indigo-300">pts</span></div>
                            <div className="text-muted-foreground text-sm">
                                {activeItem.currentBidderId ? `🔥 Top bid by ${topBidderName}` : 'No bids yet'}
                            </div>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap gap-3">
                            <Button
                                size="lg"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                disabled={!activeItem.currentBidderId}
                                onClick={onSell}
                            >
                                <Coins className="w-5 h-5 mr-2" /> Sell to {activeItem.currentBidderId ? topBidderFirstName : 'Member'} ({activeItem.currentBid})
                            </Button>
                            <Button size="lg" variant="destructive" onClick={onCancel}>
                                <XCircle className="w-5 h-5 mr-2" /> Cancel item
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-indigo-500/20 shadow-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Tag className="w-5 h-5 text-indigo-400" /> Auction items
                    </CardTitle>
                    <Button variant="destructive" size="sm" onClick={onReset} className="h-8">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset auction
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {auction.items.map((item) => (
                            <div key={item.id} className={`flex flex-col gap-2 p-4 rounded-xl border ${item.status === GAME_STATUS.ACTIVE ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-border/50 bg-background/50'} ${item.status === GAME_STATUS.SOLD ? 'opacity-60' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-muted-foreground">#{item.no}</span>
                                    <Badge variant={item.status === GAME_STATUS.ACTIVE ? 'default' : item.status === GAME_STATUS.SOLD ? 'secondary' : 'outline'} className={item.status === GAME_STATUS.ACTIVE ? 'bg-indigo-500' : item.status === GAME_STATUS.SOLD ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                        {item.status}
                                    </Badge>
                                </div>
                                <div className="font-bold text-lg leading-tight">{item.name}</div>
                                <div className="text-sm text-muted-foreground italic flex-1">{item.why}</div>

                                <div className="pt-2 mt-auto border-t border-border/50">
                                    {item.status === GAME_STATUS.SOLD ? (
                                        <div className="text-sm text-emerald-400">
                                            <div className="flex items-center gap-1 font-bold"><CheckCircle2 className="w-4 h-4" /> Won for {item.winningBid} pts</div>
                                            {item.reason && (
                                                <div className="mt-1 text-muted-foreground italic text-xs">&quot;{item.reason}&quot;</div>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            variant={item.status === GAME_STATUS.ACTIVE ? 'secondary' : 'outline'}
                                            size="sm"
                                            className="w-full"
                                            onClick={() => onOpenItem && onOpenItem(item.no)}
                                        >
                                            {item.status === GAME_STATUS.ACTIVE ? 'Re-open' : 'Open for bidding'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
