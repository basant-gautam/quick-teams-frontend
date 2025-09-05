const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// Temporary in-memory "database"
let users = [];
let sessions = {};

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
    const { fullName, email, password, skills, bio, availability } = req.body;
    
    // Validation
    if (!fullName || !email || !password) {
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
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
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
    sessions[sessionId] = {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true,
      message: "Login successful", 
      user: userWithoutPassword,
      token: sessionId,
      expiresAt: sessions[sessionId].expiresAt
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
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required" 
    });
  }
  
  // Check if session is expired
  if (new Date(sessions[token].expiresAt) < new Date()) {
    delete sessions[token];
    return res.status(401).json({ 
      success: false,
      message: "Session expired, please login again" 
    });
  }
  
  // Add user to request
  const userId = sessions[token].userId;
  req.user = users.find(u => u.id === userId);
  
  next();
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
    // Sample teammate data (in a real app, this would be in the database)
    const allTeammates = [
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
    
    // Get query parameters
    const { skill, availability, page = 1, limit = 10 } = req.query;
    
    // Filter teammates
    let filteredTeammates = [...allTeammates];
    
    if (skill) {
      filteredTeammates = filteredTeammates.filter(t => 
        t.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
    }
    
    if (availability) {
      filteredTeammates = filteredTeammates.filter(t => 
        t.availability.toLowerCase() === availability.toLowerCase()
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTeammates = filteredTeammates.slice(startIndex, endIndex);
    
    // Response with pagination metadata
    res.json({
      success: true,
      teammates: paginatedTeammates,
      pagination: {
        total: filteredTeammates.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredTeammates.length / limit)
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
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token && sessions[token]) {
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
    if (bio) user.bio = bio;
    if (skills) user.skills = skills;
    if (availability) user.availability = availability;
    
    user.updatedAt = new Date().toISOString();
    
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

// Serve static files for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 API endpoints available at http://localhost:${PORT}/api/`);
});
