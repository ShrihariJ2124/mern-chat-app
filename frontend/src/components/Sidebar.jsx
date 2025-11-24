import {
  Box,
  VStack,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Flex,
  Icon,
  Badge,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiLogOut, FiPlus, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../apiClient";
import { clearCurrentUser } from "../authUtils";

const Sidebar = ({ currentUser, selectedGroup, onSelectGroup, socket }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const isAdmin = useMemo(() => currentUser?.isAdmin, [currentUser]);

  const syncSelectedGroup = (nextGroups) => {
    if (!selectedGroup) {
      return;
    }
    const updated = nextGroups.find((g) => g._id === selectedGroup._id);
    if (updated) {
      onSelectGroup(updated);
    } else {
      onSelectGroup(null);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/groups");
      const formatted = data.map((g) => ({
        ...g,
        isJoined: g.members?.some(
          (m) => m._id?.toString() === currentUser?._id?.toString()
        ),
      }));
      setGroups(formatted);
      syncSelectedGroup(formatted);
      if (!selectedGroup && formatted.length) {
        const preferred =
          formatted.find((g) => g.isJoined) || formatted[0];
        onSelectGroup(preferred);
      }
    } catch (error) {
      toast({
        title: "Failed to load groups",
        description:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;

    const handleGroupUpdated = (data) => {
      // Refetch groups to update the member list in sidebar
      fetchGroups();
      
      // If the updated group is the selected group, also update it immediately
      if (selectedGroup && data.groupId === selectedGroup._id) {
        const updatedGroup = {
          ...selectedGroup,
          members: data.group.members,
        };
        onSelectGroup(updatedGroup);
      }
    };

    socket.on("group updated", handleGroupUpdated);

    return () => {
      socket.off("group updated", handleGroupUpdated);
    };
  }, [socket, selectedGroup, onSelectGroup]);

  const handleCreateGroup = async () => {
    if (!newGroupName || !newGroupDescription) {
      toast({
        title: "Missing fields",
        description: "Please provide both name and description.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      setCreating(true);
      const { data } = await apiClient.post("/groups", {
        name: newGroupName,
        description: newGroupDescription,
      });
      const created = data.populatedGroup || data;
      const createdWithMembership = {
        ...created,
        isJoined: true,
      };
      setGroups((prev) => {
        const next = [...prev, createdWithMembership];
        return next;
      });
      onSelectGroup(createdWithMembership);
      toast({
        title: "Group created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setNewGroupName("");
      setNewGroupDescription("");
    } catch (error) {
      toast({
        title: "Failed to create group",
        description:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLeave = async (group) => {
    const groupId = group._id;
    try {
      if (group.isJoined) {
        await apiClient.post(`/groups/${groupId}/leave`);
      } else {
        await apiClient.post(`/groups/${groupId}/join`);
      }
      
      // Refetch groups to sync state
      await fetchGroups();
      
      // Emit socket event to notify other users in the group about membership change
      if (socket && socket.connected) {
        socket.emit("join room", groupId);
      }
      
      toast({
        title: group.isJoined ? "Left group" : "Joined group",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login");
  };

  return (
    <Box
      h="100%"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      width="300px"
      display="flex"
      flexDirection="column"
    >
      <Flex
        p={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="white"
        position="sticky"
        top={0}
        zIndex={1}
        backdropFilter="blur(8px)"
        align="center"
        justify="space-between"
      >
        <Flex align="center">
          <Icon as={FiUsers} fontSize="24px" color="blue.500" mr={2} />
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Groups
          </Text>
        </Flex>
        {isAdmin && (
          <Tooltip label="Create New Group" placement="right">
            <Button
              size="sm"
              colorScheme="blue"
              variant="ghost"
              onClick={onOpen}
              borderRadius="full"
            >
              <Icon as={FiPlus} fontSize="20px" />
            </Button>
          </Tooltip>
        )}
      </Flex>

      <Box flex="1" overflowY="auto" p={4} mb={16}>
        {loading ? (
          <Flex justify="center" align="center" h="100%">
            <Spinner />
          </Flex>
        ) : (
        <VStack spacing={3} align="stretch">
          {groups.map((group) => (
            <Box
                key={group._id}
              p={4}
              cursor="pointer"
              borderRadius="lg"
                bg={
                  selectedGroup?._id === group._id
                    ? "blue.100"
                    : group.isJoined
                    ? "blue.50"
                    : "gray.50"
                }
              borderWidth="1px"
              borderColor={group.isJoined ? "blue.200" : "gray.200"}
              transition="all 0.2s"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                borderColor: "blue.300",
              }}
                onClick={() => onSelectGroup(group)}
            >
              <Flex justify="space-between" align="center">
                <Box flex="1">
                  <Flex align="center" mb={2}>
                    <Text fontWeight="bold" color="gray.800">
                      {group.name}
                    </Text>
                    {group.isJoined && (
                      <Badge ml={2} colorScheme="blue" variant="subtle">
                        Joined
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {group.description}
                  </Text>
                </Box>
                  <Button
                  size="sm"
                  colorScheme={group.isJoined ? "red" : "blue"}
                  variant={group.isJoined ? "ghost" : "solid"}
                  ml={3}
                  _hover={{
                    transform: group.isJoined ? "scale(1.05)" : "none",
                    bg: group.isJoined ? "red.50" : "blue.600",
                  }}
                  transition="all 0.2s"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinLeave(group);
                    }}
                >
                  {group.isJoined ? (
                    <Text fontSize="sm" fontWeight="medium">
                      Leave
                    </Text>
                  ) : (
                    "Join"
                  )}
                </Button>
              </Flex>
            </Box>
          ))}
        </VStack>
        )}
      </Box>

      <Box
        p={4}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        width="100%"
      >
        <Button
          width="full"
          variant="ghost"
          colorScheme="red"
          leftIcon={<Icon as={FiLogOut} />}
          _hover={{
            bg: "red.50",
            transform: "translateY(-2px)",
            shadow: "md",
          }}
          transition="all 0.2s"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Group Name</FormLabel>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Input
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Enter group description"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              mr={3}
              mt={4}
              width="full"
              onClick={handleCreateGroup}
              isLoading={creating}
            >
              Create Group
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Sidebar;
