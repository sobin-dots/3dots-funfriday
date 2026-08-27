import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { verifyToken } from './lib/jwt';
import { createBroadcast } from './socket-handlers/state.handler';
import { setupAuctionHandlers } from './socket-handlers/auction.handler';
import { setupMythHandlers } from './socket-handlers/myth.handler';
import { setupLogoHandlers } from './socket-handlers/logo.handler';
import { setupConnectionHandlers } from './socket-handlers/connection.handler';
import { setupAdminHandlers } from './socket-handlers/admin.handler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Prisma
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(httpServer);

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            const decoded = verifyToken(token) as any;
            if (decoded) {
                socket.data.user = decoded;
            }
        }
        next();
    });

    io.on('connection', async (socket) => {
        socket.data.role = socket.data.role || 'spectator';
        socket.data.memberId = socket.data.memberId || null;

        if (socket.data.user) {
            socket.data.role = socket.data.user.role === 'ADMIN' ? 'admin' : 'member';
            socket.data.memberId = socket.data.user.id;

            await prisma.member.update({
                where: { id: socket.data.user.id },
                data: { connected: true }
            });
        }

        console.log('A user connected:', socket.id, 'Role:', socket.data.role);

        const broadcast = createBroadcast(io);

        // Send initial state to the connected user and update others
        broadcast();

        // -- Identity --
        socket.on('spectator:join', (ack) => {
            socket.data.role = 'spectator';
            if (ack) ack({ ok: true });
            broadcast();
        });

        // -- Setup Handlers --
        setupAdminHandlers(socket, broadcast);
        setupAuctionHandlers(socket, broadcast);
        setupMythHandlers(socket, broadcast);
        setupLogoHandlers(socket, broadcast);
        setupConnectionHandlers(socket, broadcast);

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            if (socket.data.memberId) {
                await prisma.member.update({
                    where: { id: socket.data.memberId },
                    data: { connected: false }
                });
                broadcast();
            }
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
