import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types';
import { SOCKET_EVENTS } from '../constants/events';

let socket: Socket;

export function useGameState(isSpectator: boolean = false) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [role, setRole] = useState<'guest' | 'member' | 'admin'>('guest');
    const [memberId, setMemberId] = useState<string>('');

    useEffect(() => {
        socket = io();

        socket.on(SOCKET_EVENTS.CONNECT, () => {
            if (isSpectator) {
                socket.emit(SOCKET_EVENTS.SPECTATOR_JOIN);
                return;
            }

            const savedRole = localStorage.getItem('ff_role');
            if (savedRole === 'admin') {
                const pass = sessionStorage.getItem('ff_adminPass');
                if (pass) {
                    socket.emit(SOCKET_EVENTS.ADMIN_LOGIN, { password: pass }, (res: { ok: boolean; error?: string }) => {
                        if (res?.ok) setRole('admin');
                        else setRole('guest');
                    });
                }
            } else if (savedRole === 'member') {
                const id = localStorage.getItem('ff_memberId');
                const name = localStorage.getItem('ff_name');
                const team = localStorage.getItem('ff_team');
                if (id && name) {
                    socket.emit(SOCKET_EVENTS.MEMBER_JOIN, { memberId: id, name, team }, (res: { ok: boolean; memberId?: string; error?: string }) => {
                        if (res?.ok && res.memberId) {
                            setMemberId(res.memberId);
                            localStorage.setItem('ff_memberId', res.memberId);
                            setRole('member');
                        }
                    });
                }
            }
        });

        socket.on(SOCKET_EVENTS.STATE_UPDATE, (state: GameState) => {
            setGameState(state);
        });

        return () => {
            socket.disconnect();
        };
    }, [isSpectator]);

    const handleJoin = (name: string, team: string) => {
        if (!name.trim()) return alert('Please enter your name.');
        socket.emit(SOCKET_EVENTS.MEMBER_JOIN, { name, team }, (res: { ok: boolean; memberId?: string; error?: string }) => {
            if (res?.ok && res.memberId) {
                setMemberId(res.memberId);
                localStorage.setItem('ff_memberId', res.memberId);
                localStorage.setItem('ff_name', name);
                localStorage.setItem('ff_team', team);
                localStorage.setItem('ff_role', 'member');
                setRole('member');
            } else {
                alert(res?.error || 'Could not join.');
            }
        });
    };

    const handleAdminLogin = (password: string) => {
        socket.emit(SOCKET_EVENTS.ADMIN_LOGIN, { password }, (res: { ok: boolean; error?: string }) => {
            if (res?.ok) {
                setRole('admin');
                sessionStorage.setItem('ff_adminPass', password);
                localStorage.setItem('ff_role', 'admin');
            } else {
                alert(res?.error || 'Login failed.');
            }
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('ff_memberId');
        localStorage.removeItem('ff_name');
        localStorage.removeItem('ff_team');
        localStorage.removeItem('ff_role');
        sessionStorage.removeItem('ff_adminPass');
        setRole('guest');
        window.location.reload();
    };

    return {
        socket,
        gameState,
        role,
        memberId,
        handleJoin,
        handleAdminLogin,
        handleLogout
    };
}
