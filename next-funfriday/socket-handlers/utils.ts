import { Socket } from 'socket.io';

export const adminOnly = (socket: Socket, handler: Function) => {
    return async (...args: any[]) => {
        if (socket.data.role !== 'admin') return;
        return handler(...args);
    };
};

export const memberOnly = (socket: Socket, handler: Function) => {
    return async (...args: any[]) => {
        if (socket.data.role !== 'member') return;
        return handler(...args);
    };
};
