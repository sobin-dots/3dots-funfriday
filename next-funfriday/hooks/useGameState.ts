import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types';
import { SOCKET_EVENTS, ROLES } from '../constants';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

let socket: Socket;

export function useGameState(isSpectator: boolean = false) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [role, setRole] = useState<'guest' | 'member' | 'admin'>('guest');
    const [memberId, setMemberId] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!isSpectator && (!token || !userStr)) {
            router.push('/login');
            return;
        }

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setRole(user.role === 'ADMIN' ? 'admin' : 'member');
                setMemberId(user.id);
            } catch (e) { }
        }

        socket = io({
            auth: { token }
        });

        socket.on(SOCKET_EVENTS.CONNECT, () => {
            if (isSpectator) {
                socket.emit(SOCKET_EVENTS.SPECTATOR_JOIN);
            }
        });

        socket.on('connect_error', (err) => {
            if (!isSpectator) {
                toast.error('Session expired or invalid. Please log in again.');
                handleLogout();
            }
        });

        socket.on(SOCKET_EVENTS.STATE_UPDATE, (state: GameState) => {
            setGameState(state);
        });

        return () => {
            socket.disconnect();
        };
    }, [isSpectator, router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setRole('guest');
        router.push('/login');
    };

    return {
        socket,
        gameState,
        role,
        memberId,
        handleLogout,
    };
}
