import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { getSocketUrl } from "../apiClient";
import { getCurrentUser } from "../authUtils";

const Chat = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const socketInitializedRef = useRef(false);

  useEffect(() => {
    if (!currentUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      socketInitializedRef.current = false;
      return;
    }

    // Only initialize socket once per component mount
    if (socketInitializedRef.current) {
      return;
    }

    socketInitializedRef.current = true;

    const s = io(getSocketUrl(), {
      auth: {
        user: currentUser,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    setSocket(s);

    return () => {
      socketInitializedRef.current = false;
      s.disconnect();
    };
  }, []);

  return (
    <Flex h="100vh">
      <Box w="300px" borderRight="1px solid" borderColor="gray.200">
        <Sidebar
          currentUser={currentUser}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          socket={socket}
        />
      </Box>
      <Box flex="1">
        <ChatArea
          currentUser={currentUser}
          selectedGroup={selectedGroup}
          socket={socket}
        />
      </Box>
    </Flex>
  );
};

export default Chat;
