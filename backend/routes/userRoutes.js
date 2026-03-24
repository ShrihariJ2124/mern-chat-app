const express = require("express");
const User = require("../models/Usermodel");
const jwt = require("jsonwebtoken");

const userRouter = express.Router();

userRouter.post("/setup-admin", async (req, res) => {
  try {
    const setupKey = req.headers["x-admin-setup-key"];

    if (!process.env.ADMIN_SETUP_KEY) {
      return res
        .status(403)
        .json({ message: "Admin setup route is disabled" });
    }

    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(401).json({ message: "Invalid setup key" });
    }

    const adminData = {
      username: "Admin",
      email: "admin@gmail.com",
      password: "4321",
      isAdmin: true,
    };

    let adminUser = await User.findOne({ email: adminData.email });

    if (!adminUser) {
      adminUser = await User.create(adminData);

      return res.status(201).json({
        message: "Admin user created successfully",
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      });
    }

    adminUser.username = adminData.username;
    adminUser.password = adminData.password;
    adminUser.isAdmin = true;
    await adminUser.save();

    return res.json({
      message: "Admin user updated successfully",
      email: adminUser.email,
      isAdmin: adminUser.isAdmin,
    });
  } catch (error) {
    console.log("Admin setup failed:", error);
    return res.status(500).json({ message: error.message });
  }
});

userRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = userRouter;
