import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { getSocketUrl } from "../apiClient";

const Chat = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [socket, setSocket] = useState(null);

  const currentUser = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("chatUser");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const s = io(getSocketUrl(), {
      auth: {
        user: currentUser,
      },
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  return (
    <Flex h="100vh">
      <Box w="300px" borderRight="1px solid" borderColor="gray.200">
        <Sidebar
          currentUser={currentUser}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
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
