import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Flex,
  Icon,
  Avatar,
  InputGroup,
  InputRightElement,
  Spinner,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiSend, FiInfo, FiMessageCircle } from "react-icons/fi";
import UsersList from "./UsersList";
import { apiClient } from "../apiClient";

const ChatArea = ({ currentUser, selectedGroup, socket }) => {
  const [messages, setMessages] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const toast = useToast();

  const groupId = selectedGroup?._id;

  const headerTitle = useMemo(
    () => selectedGroup?.name || "Select a group to start chatting",
    [selectedGroup]
  );

  const loadMessages = async () => {
    if (!groupId) return;
    try {
      setLoadingMessages(true);
      const { data } = await apiClient.get(`/api/messages/${groupId}`);
      setMessages(
        data.map((m) => ({
          ...m,
          isCurrentUser: m.sender?._id === currentUser?._id,
        }))
      );
    } catch (error) {
      toast({
        title: "Failed to load messages",
        description:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (groupId && socket) {
      socket.emit("join room", groupId);
      loadMessages();
    }
    return () => {
      if (groupId && socket) {
        socket.emit("leave room", groupId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleUsersInRoom = (users) => {
      setUsersInRoom(users || []);
    };

    const handleMessageReceived = (message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          isCurrentUser: message.sender?._id === currentUser?._id,
    },
      ]);
    };

    const handleUserLeft = (userId) => {
      setUsersInRoom((prev) => prev.filter((u) => u._id !== userId));
    };

    const handleUserTyping = ({ username }) => {
      setTypingUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username]
      );
    };

    const handleUserStopTyping = ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    };

    socket.on("users in room", handleUsersInRoom);
    socket.on("message received", handleMessageReceived);
    socket.on("user left", handleUserLeft);
    socket.on("user typing", handleUserTyping);
    socket.on("user stop typing", handleUserStopTyping);

    return () => {
      socket.off("users in room", handleUsersInRoom);
      socket.off("message received", handleMessageReceived);
      socket.off("user left", handleUserLeft);
      socket.off("user typing", handleUserTyping);
      socket.off("user stop typing", handleUserStopTyping);
    };
  }, [socket, currentUser]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !groupId) return;
    try {
      setSending(true);
      const { data } = await apiClient.post("/api/messages", {
        content: newMessage,
        groupId,
      });

      const messageToEmit = {
        ...data,
        groupId,
      };

      setMessages((prev) => [
        ...prev,
        { ...messageToEmit, isCurrentUser: true },
      ]);

      if (socket) {
        socket.emit("new message", messageToEmit);
        socket.emit("stop typing", { groupId });
      }
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Failed to send message",
        description:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const handleTypingChange = (value) => {
    setNewMessage(value);
    if (!socket || !groupId) return;

    if (value) {
      socket.emit("typing", { groupId, username: currentUser?.username });
    } else {
      socket.emit("stop typing", { groupId });
    }
  };

  return (
    <Flex h="100%" position="relative">
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        bg="gray.50"
        maxW={`calc(100% - 260px)`}
      >
        {/* Chat Header */}
        <Flex
          px={6}
          py={4}
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          align="center"
          boxShadow="sm"
        >
          <Icon as={FiMessageCircle} fontSize="24px" color="blue.500" mr={3} />
          <Box flex="1">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {headerTitle}
            </Text>
            {selectedGroup && (
              <HStack spacing={2}>
            <Text fontSize="sm" color="gray.500">
                  {selectedGroup.description}
            </Text>
                <Badge colorScheme="green">
                  {usersInRoom.length} online
                </Badge>
              </HStack>
            )}
          </Box>
          <Icon
            as={FiInfo}
            fontSize="20px"
            color="gray.400"
            cursor="pointer"
            _hover={{ color: "blue.500" }}
          />
        </Flex>

        {/* Messages Area */}
        <VStack
          flex="1"
          overflowY="auto"
          spacing={4}
          align="stretch"
          px={6}
          py={4}
          position="relative"
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              width: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "gray.200",
              borderRadius: "24px",
            },
          }}
        >
          {!selectedGroup ? (
            <Flex h="100%" align="center" justify="center">
              <Text color="gray.500">
                Select a group from the left sidebar to start chatting.
              </Text>
            </Flex>
          ) : loadingMessages ? (
            <Flex h="100%" align="center" justify="center">
              <Spinner />
            </Flex>
          ) : (
            messages.map((message) => (
            <Box
              key={message._id}
              alignSelf={message.isCurrentUser ? "flex-start" : "flex-end"}
              maxW="70%"
            >
              <Flex direction="column" gap={1}>
                <Flex
                  align="center"
                  mb={1}
                  justifyContent={
                    message.isCurrentUser ? "flex-start" : "flex-end"
                  }
                  gap={2}
                >
                  {message.isCurrentUser ? (
                    <>
                      <Avatar size="xs" name={message.sender?.username} />
                      <Text fontSize="xs" color="gray.500">
                        You •{" "}
                        {new Date(message.createdAt).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text fontSize="xs" color="gray.500">
                        {message.sender?.username} •{" "}
                        {new Date(message.createdAt).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                      <Avatar size="xs" name={message.sender?.username} />
                    </>
                  )}
                </Flex>

                <Box
                  bg={message.isCurrentUser ? "blue.500" : "white"}
                  color={message.isCurrentUser ? "white" : "gray.800"}
                  p={3}
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Text>{message.content}</Text>
                </Box>
              </Flex>
            </Box>
            ))
          )}

          {typingUsers.length > 0 && (
            <Box w="100%" textAlign="left">
              <Badge colorScheme="gray" fontSize="xs">
                {typingUsers.join(", ")}{" "}
                {typingUsers.length === 1 ? "is" : "are"} typing...
              </Badge>
            </Box>
          )}
        </VStack>

        {/* Message Input */}
        <Box
          p={4}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          position="relative"
          zIndex="1"
        >
          <InputGroup size="lg">
            <Input
              placeholder={
                selectedGroup
                  ? "Type your message..."
                  : "Select a group to start chatting..."
              }
              pr="4.5rem"
              bg="gray.50"
              border="none"
              value={newMessage}
              onChange={(e) => handleTypingChange(e.target.value)}
              isDisabled={!selectedGroup}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              _focus={{
                boxShadow: "none",
                bg: "gray.100",
              }}
            />
            <InputRightElement width="4.5rem">
              <Button
                h="1.75rem"
                size="sm"
                colorScheme="blue"
                borderRadius="full"
                onClick={handleSendMessage}
                isLoading={sending}
                isDisabled={!selectedGroup || !newMessage.trim()}
                _hover={{
                  transform: "translateY(-1px)",
                }}
                transition="all 0.2s"
              >
                <Icon as={FiSend} />
              </Button>
            </InputRightElement>
          </InputGroup>
        </Box>
      </Box>

      {/* UsersList with fixed width */}
      <Box
        width="260px"
        position="sticky"
        right={0}
        top={0}
        height="100%"
        flexShrink={0}
      >
        <UsersList users={usersInRoom} />
      </Box>
    </Flex>
  );
};

export default ChatArea;
