export const SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    STATE_UPDATE: 'state-update',

    MEMBER_JOIN: 'member:join',
    ADMIN_LOGIN: 'admin:login',
    SPECTATOR_JOIN: 'spectator:join',

    ADMIN_SET_PHASE: 'admin:setPhase',
    ADMIN_RESET: 'admin:reset',
    ADMIN_KICK: 'admin:kick',

    AUCTION_OPEN: 'auction:open',
    AUCTION_BID: 'auction:bid',
    AUCTION_SELL: 'auction:sell',
    AUCTION_CANCEL: 'auction:cancel',
    AUCTION_REASON: 'auction:reason',

    MYTH_OPEN: 'myth:open',
    MYTH_VOTE: 'myth:vote',
    MYTH_REVEAL: 'myth:reveal',

    LOGO_OPEN: 'logo:open',
    LOGO_VOTE: 'logo:vote',
    LOGO_REVEAL: 'logo:reveal',

    CONNECTION_OPEN: 'connection:open',
    CONNECTION_SUBMIT: 'connection:submit',
    CONNECTION_REVEAL_GROUP: 'connection:revealGroup',
} as const;
