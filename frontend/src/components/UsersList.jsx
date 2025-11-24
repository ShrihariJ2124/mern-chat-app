import {
  Box,
  VStack,
  Text,
  Badge,
  Flex,
  Icon,
  Tooltip,
  Avatar,
} from "@chakra-ui/react";
import { FiUsers, FiCircle } from "react-icons/fi";

// Component to display individual member
const MemberCard = ({ member, isOnline }) => (
  <Box>
    <Tooltip label={isOnline ? `${member.username} is online` : `${member.username} is offline`} placement="left">
      <Flex
        p={3}
        bg={isOnline ? "white" : "gray.50"}
        borderRadius="lg"
        shadow="sm"
        align="center"
        borderWidth="1px"
        borderColor={isOnline ? "gray.100" : "gray.200"}
        opacity={isOnline ? 1 : 0.7}
        _hover={{
          borderColor: isOnline ? "blue.200" : "gray.300",
          shadow: "md",
        }}
        transition="all 0.2s"
      >
        <Avatar
          size="sm"
          name={member.username}
          bg={isOnline ? "blue.500" : "gray.400"}
          color="white"
          mr={3}
        />
        <Box flex="1">
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={isOnline ? "gray.700" : "gray.500"}
            noOfLines={1}
          >
            {member.username}
          </Text>
        </Box>
        <Flex
          align="center"
          bg={isOnline ? "green.50" : "gray.100"}
          px={2}
          py={1}
          borderRadius="full"
        >
          <Icon
            as={FiCircle}
            color={isOnline ? "green.400" : "gray.300"}
            fontSize="8px"
            mr={1}
          />
          <Text 
            fontSize="xs" 
            color={isOnline ? "green.600" : "gray.500"}
            fontWeight="medium"
          >
            {isOnline ? "online" : "offline"}
          </Text>
        </Flex>
      </Flex>
    </Tooltip>
  </Box>
);

const UsersList = ({ users, groupMembers = [] }) => {
  // users here are online users from socket
  const onlineUserIds = new Set(users.map(u => u._id?.toString()));
  
  // Combine online users with group members, showing online status
  const allMembersWithStatus = groupMembers.map(member => ({
    ...member,
    isOnline: onlineUserIds.has(member._id?.toString()),
  }));
  
  // Separate online and offline members
  const onlineMembers = allMembersWithStatus.filter(m => m.isOnline);
  const offlineMembers = allMembersWithStatus.filter(m => !m.isOnline);
  
  return (
    <Box
      h="100%"
      w="100%"
      borderLeft="1px solid"
      borderColor="gray.200"
      bg="white"
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Flex
        p={5}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="white"
        align="center"
        position="sticky"
        top={0}
        zIndex={1}
        boxShadow="sm"
      >
        <Icon as={FiUsers} fontSize="20px" color="blue.500" mr={2} />
        <Text fontSize="lg" fontWeight="bold" color="gray.700">
          Members
        </Text>
        <Badge
          ml={2}
          colorScheme="green"
          borderRadius="full"
          px={2}
          py={0.5}
          fontSize="xs"
        >
          {allMembersWithStatus.length} total ({onlineMembers.length} online)
        </Badge>
      </Flex>

      {/* Users List */}
      <Box flex="1" overflowY="auto" p={4}>
        {allMembersWithStatus.length === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
            No members in this group
          </Text>
        ) : (
          <VStack align="stretch" spacing={2}>
            {/* Online Members Section */}
            {onlineMembers.length > 0 && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="green.600" px={2}>
                  ONLINE ({onlineMembers.length})
                </Text>
                {onlineMembers.map((member) => (
                  <MemberCard key={member._id} member={member} isOnline={true} />
                ))}
              </>
            )}
            
            {/* Offline Members Section */}
            {offlineMembers.length > 0 && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" px={2} mt={2}>
                  OFFLINE ({offlineMembers.length})
                </Text>
                {offlineMembers.map((member) => (
                  <MemberCard key={member._id} member={member} isOnline={false} />
                ))}
              </>
            )}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default UsersList;
