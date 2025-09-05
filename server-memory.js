const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require('dotenv').config();

// Set up global error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// In-memory database
let users = [
  {
    id: 1,
    fullName: 'Test User', 
    email: 'test@example.com', 
    password: 'drowssaphashed', // hashPassword('password')
    skills: ['JavaScript', 'React'],
    bio: "Test user for development",
    availability: "Now",
    createdAt: new Date()
  }
];

let sessions = {};

let teammates = [
  { 
    id: 1, 
    name: "Alice Johnson", 
    skills: ["Python", "Machine Learning", "Data Science"], 
    availability: "Now",
    bio: "AI researcher with 5 years of experience",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg"
  },
  { 
    id: 2, 
    name: "Bob Smith", 
    skills: ["JavaScript", "React", "UI/UX Design"], 
    availability: "Later Today",
    bio: "Frontend developer passionate about creating beautiful interfaces",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg" 
  },
  { 
    id: 3, 
    name: "Charlie Davis", 
    skills: ["AI", "Design", "Project Management"], 
    availability: "This Weekend",
    bio: "Product designer with AI expertise",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg"
  },
  { 
    id: 4, 
    name: "Diana Miller", 
    skills: ["Node.js", "MongoDB", "AWS"], 
    availability: "Next Week",
    bio: "Backend developer specialized in cloud architecture",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg"
  },
  { 
    id: 5, 
    name: "Ethan Wilson", 
    skills: ["Mobile Dev", "Flutter", "Firebase"], 
    availability: "Now",
    bio: "Mobile app developer who loves creating cross-platform solutions",
    avatar: "https://randomuser.me/api/portraits/men/5.jpg"
  }
];

// Helper functions
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Basic password hashing (in a real app, use bcrypt)
const hashPassword = (password) => {
  // This is a simple hash for demo purposes only
  // In production, use bcrypt or another secure hashing library
  return password.split('').reverse().join('') + "hashed";
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Signup
app.post("/api/signup", (req, res) => {
  try {
    console.log("\n");
    console.log("=============================================");
    console.log("🔔 SIGNUP REQUEST RECEIVED");
    console.log("=============================================");
    console.log("Request Body:", req.body);
    
    const { fullName, email, password, skills, bio, availability } = req.body;
    
    // Validation
    if (!fullName || !email || !password) {
      console.log("❌ Validation Error: Missing required fields");
      return res.status(400).json({ 
        success: false,
        message: "Please provide name, email and password" 
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide a valid email address" 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long" 
      });
    }
    
    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }
    
    // Create new user
    const hashedPassword = hashPassword(password);
    const newUser = { 
      id: users.length + 1,
      fullName, 
      email: email.toLowerCase(), 
      password: hashedPassword, 
      skills: skills || [],
      bio: bio || "",
      availability: availability || "Not specified",
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Log user signup in terminal
    console.log("\n");
    console.log("=============================================");
    console.log("✅ USER SIGNUP SUCCESSFUL");
    console.log("=============================================");
    console.log(`👤 New user: ${fullName} (${email})`);
    console.log(`📊 Total users: ${users.length}`);
    console.log(`🕒 Time: ${new Date().toLocaleString()}`);
    
    res.status(201).json({ 
      success: true,
      message: "Signup successful", 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during signup process" 
    });
  }
});

// Login
app.post("/api/login", (req, res) => {
  try {
    console.log("\n");
    console.log("=============================================");
    console.log("🔔 LOGIN REQUEST RECEIVED");
    console.log("=============================================");
    console.log("Request Body:", req.body);
    
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      console.log("❌ Validation Error: Missing email or password");
      return res.status(400).json({ 
        success: false,
        message: "Please provide both email and password" 
      });
    }
    
    // Find user and verify credentials
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === hashPassword(password)
    );
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
    
    // Generate session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    sessions[sessionId] = {
      userId: user.id,
      createdAt: new Date(),
      expiresAt
    };
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    // Log user login in terminal
    console.log("\n");
    console.log("=============================================");
    console.log("✅ USER LOGIN SUCCESSFUL");
    console.log("=============================================");
    console.log(`👤 User: ${user.fullName} (${user.email})`);
    console.log(`🕒 Login time: ${new Date().toLocaleString()}`);
    console.log(`🔒 Session expires: ${expiresAt.toLocaleString()}`);
    console.log(`🔑 Session token: ${sessionId.substring(0, 8)}...`);
    
    res.json({ 
      success: true,
      message: "Login successful", 
      user: userWithoutPassword,
      token: sessionId,
      expiresAt: expiresAt
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login process" 
    });
  }
});

// Authentication middleware
const authenticateUser = (req, res, next) => {
  try {
    console.log("\n");
    console.log("---------------------------------------------");
    console.log("🔐 AUTHENTICATING REQUEST");
    console.log("---------------------------------------------");
    console.log(`📌 Path: ${req.path}`);
    console.log(`📌 Method: ${req.method}`);
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log("❌ Authentication failed: No token provided");
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }
    
    if (!sessions[token]) {
      console.log("❌ Authentication failed: Invalid token");
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }
    
    // Check if session is expired
    if (new Date(sessions[token].expiresAt) < new Date()) {
      console.log("❌ Authentication failed: Session expired");
      delete sessions[token];
      return res.status(401).json({ 
        success: false,
        message: "Session expired, please login again" 
      });
    }
    
    // Add user to request
    const userId = sessions[token].userId;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      console.log("❌ Authentication failed: User not found");
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    req.user = user;
    req.token = token;
    
    console.log("✅ Authentication successful");
    console.log(`👤 User: ${user.fullName} (${user.email})`);
    console.log(`🔑 Session: ${token.substring(0, 8)}...`);
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication"
    });
  }
};

// Get user profile
app.get("/api/profile", authenticateUser, (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile"
    });
  }
});

// Teammates with filtering and pagination
app.get("/api/teammates", authenticateUser, (req, res) => {
  try {
    // Get query parameters
    const { skill, availability, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Filter teammates
    let filteredTeammates = [...teammates];
    
    if (skill) {
      filteredTeammates = filteredTeammates.filter(t => 
        t.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
    }
    
    if (availability) {
      filteredTeammates = filteredTeammates.filter(t => 
        t.availability.toLowerCase().includes(availability.toLowerCase())
      );
    }
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedTeammates = filteredTeammates.slice(startIndex, endIndex);
    
    // Response with pagination metadata
    res.json({
      success: true,
      teammates: paginatedTeammates,
      pagination: {
        total: filteredTeammates.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(filteredTeammates.length / limitNum)
      }
    });
  } catch (error) {
    console.error("Teammates error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching teammates"
    });
  }
});

// Logout endpoint
app.post("/api/logout", authenticateUser, (req, res) => {
  try {
    const token = req.token;
    
    if (sessions[token]) {
      // Log user logout
      const user = req.user;
      console.log(`👋 User logged out: ${user.fullName} (${user.email})`);
      console.log(`🕒 Logout time: ${new Date().toLocaleString()}`);
      
      delete sessions[token];
    }
    
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout process"
    });
  }
});

// Update profile
app.put("/api/profile", authenticateUser, (req, res) => {
  try {
    const { fullName, bio, skills, availability } = req.body;
    const user = req.user;
    
    // Update user data
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (availability) user.availability = availability;
    
    user.updatedAt = new Date().toISOString();
    
    // Log profile update
    console.log(`✏️ User updated profile: ${user.fullName} (${user.email})`);
    if (fullName) console.log(`  • Name changed to: ${fullName}`);
    if (skills) console.log(`  • Skills updated: ${skills.join(', ')}`);
    if (availability) console.log(`  • Availability set to: ${availability}`);
    if (bio !== undefined) console.log(`  • Bio updated`);
    
    // Return updated user without password
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile"
    });
  }
});

// Admin route to see all users (in a real app, this would require admin authentication)
app.get("/api/admin/users", (req, res) => {
  try {
    // Create a version of users without passwords
    const safeUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    // Log this access to terminal
    console.log(`🔍 Admin accessed user list at ${new Date().toLocaleString()}`);
    
    res.json({
      success: true,
      users: safeUsers,
      total: users.length,
      activeSessions: Object.keys(sessions).length
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users"
    });
  }
});

// Serve the main index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server'
  });
});

const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`💾 Using in-memory storage (no MongoDB)`);
  
  // Log initial users
  console.log(`\n👥 Current users in the system (${users.length}):`);
  users.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.fullName} (${user.email})`);
  });
  
  // Log active sessions every 5 minutes
  setInterval(() => {
    const activeSessions = Object.keys(sessions).length;
    if (activeSessions > 0) {
      console.log(`\n🔐 Active sessions (${activeSessions}):`);
      Object.entries(sessions).forEach(([token, session], index) => {
        const user = users.find(u => u.id === session.userId);
        if (user) {
          console.log(`  ${index + 1}. ${user.fullName} - Expires: ${session.expiresAt.toLocaleString()}`);
        }
      });
    }
  }, 300000); // 5 minutes
});
