import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { setIO } from './socketInstance.js';
import { addUser, getSocketId, removeUser } from './socketManager.js';

export default function initializeSocket(server) {

    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    setIO(io);

    // JWT Authentication middleware for incoming socket connections
    io.use((socket, next) => {
        try {
            const authHeader = socket.handshake.headers?.authorization;
            const token = socket.handshake.auth?.token ||
                          (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader) ||
                          socket.handshake.query?.token;

            if (token) {
                const secret = process.env.AUTH_SECRETKEY || process.env.JWT_SECRET;
                try {
                    const decoded = jwt.verify(token, secret);
                    socket.user = decoded;
                    socket.userId = decoded.data?.id || decoded.id;
                    return next();
                } catch (jwtErr) {
                    // Try fallback admin secret if secret was user key
                    if (process.env.JWT_SECRET && process.env.JWT_SECRET !== secret) {
                        try {
                            const decodedAdmin = jwt.verify(token, process.env.JWT_SECRET);
                            socket.user = decodedAdmin;
                            socket.userId = decodedAdmin.data?.id || decodedAdmin.id;
                            return next();
                        } catch (e) {
                            return next(new Error("Unauthorized: Invalid token"));
                        }
                    }
                    return next(new Error("Unauthorized: Invalid token"));
                }
            }

            // Fallback for legacy connections during migration
            const fallbackUserId = socket.handshake.query?.userId;
            if (fallbackUserId) {
                socket.userId = fallbackUserId;
                return next();
            }

            return next(new Error("Unauthorized: Authentication token required"));
        } catch (err) {
            return next(new Error("Unauthorized: " + err.message));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.userId;

        if (userId) {
            addUser(userId, socket.id);
            console.log(`User ${userId} connected`);
        }

        // Receive message from sender
        socket.on("message", (data) => {
            console.log("Received:", data);

            // Ensure senderId is bound to the authenticated user
            const authenticatedSenderId = socket.userId || data?.senderId;
            const receiverSocket = getSocketId(data?.receiverId);

            console.log("Receiver Socket:", receiverSocket);

            if (receiverSocket) {
                io.to(receiverSocket).emit("receive-message", {
                    senderId: authenticatedSenderId,
                    message: data?.message
                });
                console.log("Message sent");
            } else {
                console.log("Receiver Offline");
            }
        });

        socket.on("disconnect", () => {
            if (userId) {
                removeUser(userId);
                console.log(`User ${userId} disconnected`);
            }
        });
    });

    return io;
}
