const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const dataService = require("../data/dataService");

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "7d"
  });
}

function buildUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const allowedRoles = ["Parent", "Teacher", "Counselor"];
    const safeRole = allowedRoles.includes(role) ? role : "Parent";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existingUser = await dataService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await dataService.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: safeRole
    });

    const token = createToken(user._id);

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to register user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await dataService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = createToken(user._id);

    res.json({
      message: "Login successful.",
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to log in." });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  res.json({
    user: buildUserResponse(req.user)
  });
});

module.exports = router;
