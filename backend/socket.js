const socketIo = (io) => {
  // Map of socket.id => { user, room }
  const connectedUsers = new Map();

  const getUniqueUsersInRoom = (roomId) => {
    const users = Array.from(connectedUsers.values())
      .filter((u) => u.room === roomId)
      .map((u) => u.user)
      .filter(Boolean);

    // Deduplicate by user _id
    const map = new Map();
    for (const u of users) {
      const id = u?._id?.toString();
      if (!id) continue;
      if (!map.has(id)) map.set(id, u);
    }
    return Array.from(map.values());
  };

  const hasAnySocketForUserInRoom = (userId, roomId) => {
    return Array.from(connectedUsers.values()).some(
      (entry) => entry.room === roomId && entry.user?._id?.toString() === userId?.toString()
    );
  };

  io.on("connection", (socket) => {
    const user = socket.handshake.auth?.user;
    console.log("User connected", user?.username);

    socket.on("join room", (groupId) => {
      socket.join(groupId);
      connectedUsers.set(socket.id, { user, room: groupId });

      const uniqueUsers = getUniqueUsersInRoom(groupId);
      // Emit to ALL users in the room (including the joining user)
      io.in(groupId).emit("users in room", uniqueUsers);

      socket.to(groupId).emit("notification", {
        type: "USER_JOINED",
        message: `${user?.username} has joined the chat`,
        user: user,
      });
    });

    socket.on("leave room", (groupId) => {
      console.log(`${user?.username} leaving room:`, groupId);
      socket.leave(groupId);

      // Remove this socket's entry
      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
      }

      // Emit updated unique users list for the room
      const uniqueUsers = getUniqueUsersInRoom(groupId);
      io.in(groupId).emit("users in room", uniqueUsers);

      // If no remaining sockets for this user in the room, notify
      if (!hasAnySocketForUserInRoom(user?._id, groupId)) {
        socket.to(groupId).emit("user left", user?._id);
      }
    });

    socket.on("new message", (message) => {
      socket.to(message.groupId).emit("message received", message);
    });

    socket.on("disconnect", () => {
      console.log(`${user?.username} disconnected`);
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id);
        const roomId = userData.room;

        // remove the socket entry
        connectedUsers.delete(socket.id);

        // Emit updated unique users list for the room to all users (including those who might disconnect)
        if (roomId) {
          const uniqueUsers = getUniqueUsersInRoom(roomId);
          io.in(roomId).emit("users in room", uniqueUsers);

          // notify others only if user has no other sockets in the room
          if (!hasAnySocketForUserInRoom(user?._id, roomId)) {
            io.in(roomId).emit("user left", user?._id);
          }
        }
      }
    });

    socket.on("typing", ({ groupId, username }) => {
      socket.to(groupId).emit("user typing", { username });
    });

    socket.on("stop typing", ({ groupId }) => {
      socket.to(groupId).emit("user stop typing", { username: user?.username });
    });
  });
};

module.exports = socketIo;
