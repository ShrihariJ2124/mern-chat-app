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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSend, FiInfo, FiMessageCircle, FiLogOut } from "react-icons/fi";
import UsersList from "./UsersList";
import { apiClient } from "../apiClient";
import { clearCurrentUser } from "../authUtils";

const ChatArea = ({ currentUser, selectedGroup, socket }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const toast = useToast();

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login");
  };

  useEffect(() => {
    if (!selectedGroup) {
      return;
    }
    // Ensure selectedGroup has members populated
    if (!selectedGroup.members) {
      selectedGroup.members = [];
    }
  }, [selectedGroup]);

  const groupId = selectedGroup?._id;
  const currentUserId = currentUser?._id;

  const headerTitle = useMemo(
    () => selectedGroup?.name || "Select a group to start chatting",
    [selectedGroup]
  );

  const loadMessages = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoadingMessages(true);
      const { data } = await apiClient.get(`/messages/${groupId}`);
      setMessages(
        data.map((m) => ({
          ...m,
          isCurrentUser: m.sender?._id === currentUserId,
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
  }, [groupId, currentUserId, toast]);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      setUsersInRoom([]);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !socket || !selectedGroup?.isJoined) {
      return;
    }

    socket.emit("join room", groupId);
    loadMessages();

    return () => {
      socket.emit("leave room", groupId);
    };
  }, [groupId, socket, selectedGroup?.isJoined, loadMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleUsersInRoom = (users) => {
      if (!users || !Array.isArray(users)) {
        setUsersInRoom([]);
        return;
      }
      const map = new Map();
      for (const u of users) {
        const id = u?._id?.toString();
        if (!id) continue;
        if (!map.has(id)) map.set(id, u);
      }
      setUsersInRoom(Array.from(map.values()));
    };

    const handleMessageReceived = (message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          isCurrentUser: message.sender?._id === currentUserId,
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

    const handleNotification = (notification) => {
      // Show notification when user joins/leaves
      if (notification.type === "USER_JOINED" || notification.type === "USER_LEFT") {
        toast({
          description: notification.message,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    const handleGroupUpdated = (data) => {
      // When group members change, check if it's the group we're viewing
      if (selectedGroup && data.groupId === selectedGroup._id) {
        // Update the selected group with the new member list
        const updatedGroup = {
          ...selectedGroup,
          members: data.group.members,
        };
        // Force re-render by calling parent's callback
        // This will update the selectedGroup prop
      }
      
      console.log("Group updated event received:", data);
      toast({
        description: data.type === "MEMBER_JOINED" 
          ? `${data.newMember?.username} joined the group` 
          : `${data.leftMember?.username} left the group`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    };

    socket.on("users in room", handleUsersInRoom);
    socket.on("message received", handleMessageReceived);
    socket.on("user left", handleUserLeft);
    socket.on("user typing", handleUserTyping);
    socket.on("user stop typing", handleUserStopTyping);
    socket.on("notification", handleNotification);
    socket.on("group updated", handleGroupUpdated);

    return () => {
      socket.off("users in room", handleUsersInRoom);
      socket.off("message received", handleMessageReceived);
      socket.off("user left", handleUserLeft);
      socket.off("user typing", handleUserTyping);
      socket.off("user stop typing", handleUserStopTyping);
      socket.off("notification", handleNotification);
      socket.off("group updated", handleGroupUpdated);
    };
  }, [socket, currentUser, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !groupId) return;
    try {
      setSending(true);
      const { data } = await apiClient.post("/messages", {
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
          justify="space-between"
          boxShadow="sm"
        >
          <HStack flex="1" spacing={3}>
            <Icon as={FiMessageCircle} fontSize="24px" color="blue.500" />
            <Box>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {headerTitle}
              </Text>
              {selectedGroup && (
                <Text fontSize="sm" color="gray.500">
                  {selectedGroup.description}
                </Text>
              )}
            </Box>
          </HStack>

          <HStack spacing={4}>
            {currentUser && (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    <Avatar
                      size="sm"
                      name={currentUser.username}
                      bg="blue.500"
                    />
                  }
                  _hover={{ bg: "gray.100" }}
                >
                  <Text fontSize="sm" color="gray.700">
                    {currentUser.username}
                  </Text>
                </MenuButton>
                <MenuList>
                  <MenuItem
                    icon={<Icon as={FiLogOut} />}
                    onClick={handleLogout}
                    color="red.600"
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
            <Tooltip label="Group Information" placement="left">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Show group information"
                _hover={{ bg: "gray.100" }}
              >
                <Icon
                  as={FiInfo}
                  fontSize="20px"
                  color="gray.400"
                  _hover={{ color: "blue.500" }}
                />
              </Button>
            </Tooltip>
          </HStack>
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
          ) : !selectedGroup.isJoined ? (
            <Flex h="100%" align="center" justify="center">
              <Text color="gray.500">
                Join this group to load messages and start chatting.
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
              isDisabled={!selectedGroup || !selectedGroup.isJoined}
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
                isDisabled={
                  !selectedGroup ||
                  !selectedGroup.isJoined ||
                  !newMessage.trim()
                }
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
        <UsersList 
          users={usersInRoom} 
          groupMembers={selectedGroup?.members || []}
        />
      </Box>
    </Flex>
  );
};

export default ChatArea;
