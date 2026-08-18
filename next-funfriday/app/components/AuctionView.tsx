'use client';

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

interface AuctionViewProps {
    role: 'member' | 'admin';
    auction: AuctionState;
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
    memberPoints = 0,
    onBid,
    onOpenItem,
    onSell,
    onCancel,
    onReset
}: AuctionViewProps) {
    const activeItem = auction.items.find((i) => i.no === auction.activeItemId);

    if (role === 'member') {
        if (!activeItem) {
            return <div className="card empty">🏷️ Auction is open. Waiting for the facilitator to put up the next item…</div>;
        }

        const canBid = activeItem.status === 'active';

        return (
            <div className="card">
                <div className="bigitem">
                    <div className="no">ITEM #{activeItem.no}</div>
                    <div className="name">{activeItem.name}</div>
                    <div className="why">{activeItem.why}</div>
                    <div className="bid-display">{activeItem.currentBid} pts</div>
                    <div className="bid-by">
                        {activeItem.currentBidderId ? 'Top bid placed' : 'No bids yet — start it off!'}
                    </div>
                </div>

                {canBid ? (
                    <div style={{ marginTop: '16px' }}>
                        <div className="row">
                            <input
                                className="grow"
                                id="bid-amount"
                                type="number"
                                min={activeItem.currentBid + 1}
                                max={memberPoints}
                                placeholder={`Your bid (max ${memberPoints})`}
                            />
                            <button id="bid-send" onClick={() => {
                                const val = (document.getElementById('bid-amount') as HTMLInputElement).value;
                                if (val && onBid) onBid(Number(val));
                            }}>
                                Place bid
                            </button>
                        </div>
                        <div className="quickbids">
                            {[5, 10, 20].map((step) => {
                                const nextBid = activeItem.currentBid + step;
                                if (nextBid <= memberPoints) {
                                    return (
                                        <button
                                            key={step}
                                            className="secondary small quickbid"
                                            onClick={() => onBid && onBid(nextBid)}
                                        >
                                            +{step} → {nextBid}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                            {memberPoints > activeItem.currentBid && (
                                <button
                                    className="warn small quickbid"
                                    onClick={() => onBid && onBid(memberPoints)}
                                >
                                    All in ({memberPoints})
                                </button>
                            )}
                        </div>
                        <p className="muted center" style={{ marginTop: '8px' }}>
                            You have <b>{memberPoints}</b> points to spend.
                        </p>
                    </div>
                ) : (
                    <p className="empty">This item is closed.</p>
                )}
            </div>
        );
    }

    // Admin View
    return (
        <>
            {activeItem && (
                <div className="card">
                    <h2>🔴 Live now — Item #{activeItem.no}</h2>
                    <div className="bigitem">
                        <div className="name">{activeItem.name}</div>
                        <div className="why">{activeItem.why}</div>
                        <div className="bid-display">{activeItem.currentBid} pts</div>
                        <div className="bid-by">
                            {activeItem.currentBidderId ? 'Top bid placed' : 'No bids yet'}
                        </div>
                    </div>
                    <div className="row" style={{ marginTop: '14px' }}>
                        <button
                            className="good grow"
                            disabled={!activeItem.currentBidderId}
                            onClick={onSell}
                        >
                            💰 Sell ({activeItem.currentBid})
                        </button>
                        <button className="bad" onClick={onCancel}>
                            Cancel item
                        </button>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="flex-between">
                    <h2>🏷️ Auction items</h2>
                    <button className="bad small" onClick={onReset}>
                        Reset auction
                    </button>
                </div>
                <div className="item-list">
                    {auction.items.map((i) => (
                        <div key={i.id} className={`item-tile ${i.status}`}>
                            <div className="flex-between">
                                <span className="t-name">#{i.no}</span>
                                <span className={`badge ${i.status}`}>{i.status}</span>
                            </div>
                            <div className="t-name">{i.name}</div>
                            <div className="t-why">{i.why}</div>
                            {i.status === 'sold' ? (
                                <div className="muted">
                                    ✅ Won for <b>{i.winningBid}</b> pts
                                    {i.reason && (
                                        <>
                                            <br />💬 &quot;{i.reason}&quot;
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button
                                    className="small"
                                    onClick={() => onOpenItem && onOpenItem(i.no)}
                                >
                                    {i.status === 'active' ? 'Re-open' : 'Open for bidding'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
