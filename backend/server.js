const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const bcrypt = require("bcryptjs");
const User = require("./models/Usermodel");
const userRouter = require("./routes/userRoutes");
const socketIo = require("./socket");
const groupRouter = require("./routes/groupRoutes");
const messageRouter = require("./routes/messageRoutes");
dotenv.config();

const app = express();
const server = http.createServer(app);
const normalizeOrigin = (origin) =>
  origin ? origin.replace(/\/$/, "") : origin;

const allowedOrigins = [
  "http://localhost:5173",
  "https://mern-chat-app-smoky.vercel.app",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map(normalizeOrigin);

const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(normalizeOrigin(origin));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.error(`Blocked by CORS: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const io = require("socket.io")(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.error(`Blocked Socket.IO origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
//middlewares
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} origin=${req.headers.origin || "none"}`
  );
  next();
});
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

//Initialize
socketIo(io);
//our routes
app.get("/", (req, res) => {
  res.json({
    project: "MERN Chat App using Socket.IO",
    message: "Welcome to MERN Chat Application",
    developedBy: "Shrihari J",
    website: "https://shriharij2124.github.io/my-portfolio/",
  });
});
app.get("/fix-admin", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("4321", 10);

    await User.findOneAndUpdate(
      { email: "admin@gmail.com" },
      {
        username: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        isAdmin: true,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.send("Admin fixed ✅");
  } catch (error) {
    console.log("Fix admin failed:", error);
    res.status(500).send("Failed to fix admin");
  }
});
app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter(io));
app.use("/api/messages", messageRouter);

//start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, console.log("Server is up and running on port", PORT));
