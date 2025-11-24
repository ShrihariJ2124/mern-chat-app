import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";
import { useState } from "react";
import { apiClient } from "../apiClient";
import { setCurrentUser } from "../authUtils";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.post("/users/login", {
        email,
        password,
      });

      // Backend returns user data directly, so check for _id
      if (data?._id) {
        setCurrentUser(data);

        toast({
          title: "Login successful",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        navigate("/chat");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      toast({
        title: "Login failed",
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

  return (
    <Box
      w="100%"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-r, blue.600, purple.600)"
    >
      <Box
        display="flex"
        w={["95%", "90%", "80%", "75%"]}
        maxW="1200px"
        h={["auto", "auto", "600px"]}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="2xl"
      >
        {/* Left Panel */}
        <Box
          display={["none", "none", "flex"]}
          w="50%"
          bgImage="url('https://images.unsplash.com/photo-1579548122080-c35fd6820ecb')"
          bgSize="cover"
          bgPosition="center"
          position="relative"
        >
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="blackAlpha.600"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            p={10}
            color="white"
          >
            <Text fontSize="4xl" fontWeight="bold" mb={4}>
              Welcome Back
            </Text>
            <Text fontSize="lg" maxW="400px">
              Stay connected with friends and family through instant messaging
            </Text>
          </Box>
        </Box>

        {/* Right Panel */}
        <Box
          w={["100%", "100%", "50%"]}
          bg="white"
          p={[6, 8, 10]}
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <Box display={["block", "block", "none"]} textAlign="center" mb={6}>
            <Box
              as={FiLogIn}
              mx="auto"
              fontSize="3rem"
              color="blue.600"
              mb={2}
            />
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Welcome Back
            </Text>
          </Box>

          <VStack
            as="form"
            onSubmit={handleSubmit}
            spacing={6}
            w="100%"
            maxW="400px"
            mx="auto"
          >
            <FormControl id="email" isRequired>
              <FormLabel color="gray.700" fontWeight="medium">
                Email
              </FormLabel>
              <Input
                type="email"
                placeholder="Enter your email"
                size="lg"
                bg="gray.50"
                borderColor="gray.200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                _hover={{ borderColor: "blue.500" }}
                _focus={{ borderColor: "blue.500" }}
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel color="gray.700" fontWeight="medium">
                Password
              </FormLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                size="lg"
                bg="gray.50"
                borderColor="gray.200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                _hover={{ borderColor: "blue.500" }}
                _focus={{ borderColor: "blue.500" }}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              size="lg"
              fontSize="md"
              leftIcon={<FiLogIn />}
              isLoading={loading}
            >
              Sign In
            </Button>

            <Text color="gray.600">
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "var(--chakra-colors-blue-600)",
                  fontWeight: "500",
                }}
              >
                Register now
              </Link>
            </Text>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
