const onlineUsers = new Map();

export const addUser = (userId, socketId) => {
    onlineUsers.set(userId, socketId);

    console.log(onlineUsers);
};

export const removeUser = (userId) => {
    onlineUsers.delete(userId);
};

export const getSocketId = (userId) => {
    return onlineUsers.get(userId);
};