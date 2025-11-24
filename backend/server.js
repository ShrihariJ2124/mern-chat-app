const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");

const userRouter = require("./routes/userRoutes");
const groupRouter = require("./routes/groupRoutes");
const messageRouter = require("./routes/messageRoutes");
const socketIo = require("./socket");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// MIDDLEWARES
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// CONNECT DATABASE
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("DB Connection Failed:", err));

// SOCKET.IO INIT
socketIo(io);

// ROUTES
app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/messages", messageRouter);

// DEFAULT ROUTE
app.get("/", (req, res) => {
  res.json({ message: "API Working locally" });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: err.message });
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on port", PORT));
