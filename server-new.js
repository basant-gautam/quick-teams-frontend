const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
require('dotenv').config();

// Set up global error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Don't exit the process, just log it
});


process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Don't exit the process, just log it
});


const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// Mongoose Schemas
let User, Session, Teammate;

// In-memory data (used as fallback)
let users = [];
let sessions = {};
let inMemoryTeammates = [
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

// Flag to track if MongoDB is available
let isMongoDBAvailable = false;

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
app.post("/api/signup", async (req, res) => {
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
    
    if (isMongoDBAvailable) {
      try {
        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return res.status(409).json({ 
            success: false,
            message: "User with this email already exists" 
          });
        }
        
        // Create new user in MongoDB
        const hashedPassword = hashPassword(password);
        const newUser = new User({ 
          fullName, 
          email: email.toLowerCase(), 
          password: hashedPassword, 
          skills: skills || [],
          bio: bio || "",
          availability: availability || "Not specified"
        });
        
        await newUser.save();
        
        // Return user data without password
        const userObject = newUser.toObject();
        const { password: _, ...userWithoutPassword } = userObject;
        
        res.status(201).json({ 
          success: true,
          message: "Signup successful", 
          user: userWithoutPassword 
        });
      } catch (mongoError) {
        console.error("MongoDB error during signup:", mongoError);
        // Fall back to in-memory if MongoDB operation fails
        useInMemorySignup();
      }
    } else {
      useInMemorySignup();
    }
    
    // In-memory signup helper function
    function useInMemorySignup() {
      // Check if user already exists in memory
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
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during signup process" 
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide both email and password" 
      });
    }
    
    if (isMongoDBAvailable) {
      try {
        // Find user and verify credentials in MongoDB
        const user = await User.findOne({ 
          email: email.toLowerCase(), 
          password: hashPassword(password)
        });
        
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            message: "Invalid email or password" 
          });
        }
        
        // Generate session
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Create and save the session in MongoDB
        try {
          const newSession = new Session({
            userId: user._id,
            token: sessionId,
            expiresAt
          });
          
          await newSession.save();
        } catch (sessionError) {
          console.error("Session save error:", sessionError);
          // Continue even if session save fails
        }
        
        // Also maintain in-memory sessions for compatibility
        sessions[sessionId] = {
          userId: user._id,
          createdAt: new Date(),
          expiresAt
        };
        
        // Return user data without password
        const userObject = user.toObject();
        const { password: _, ...userWithoutPassword } = userObject;
        
        res.json({ 
          success: true,
          message: "Login successful", 
          user: userWithoutPassword,
          token: sessionId,
          expiresAt: expiresAt
        });
      } catch (mongoError) {
        console.error("MongoDB error during login:", mongoError);
        // Fall back to in-memory if MongoDB operation fails
        useInMemoryLogin();
      }
    } else {
      useInMemoryLogin();
    }
    
    // In-memory login helper function
    function useInMemoryLogin() {
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
      
      res.json({ 
        success: true,
        message: "Login successful", 
        user: userWithoutPassword,
        token: sessionId,
        expiresAt: expiresAt
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login process" 
    });
  }
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }
    
    if (isMongoDBAvailable) {
      try {
        // Check session in MongoDB
        const session = await Session.findOne({ token });
        
        if (session) {
          // Check if session is expired
          if (new Date(session.expiresAt) < new Date()) {
            // Clean up expired sessions
            await Session.deleteOne({ token });
            
            return res.status(401).json({ 
              success: false,
              message: "Session expired, please login again" 
            });
          }
          
          // Add user to request
          const user = await User.findById(session.userId);
          
          if (!user) {
            return res.status(401).json({ 
              success: false,
              message: "User not found" 
            });
          }
          
          req.user = user;
          req.token = token;
          req.session = session;
          
          return next();
        }
      } catch (mongoError) {
        console.error("MongoDB error during authentication:", mongoError);
        // Fall back to in-memory if MongoDB operation fails
      }
    }
    
    // Fall back to in-memory session check
    if (!sessions[token]) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }
    
    // Check if in-memory session is expired
    if (new Date(sessions[token].expiresAt) < new Date()) {
      delete sessions[token];
      return res.status(401).json({ 
        success: false,
        message: "Session expired, please login again" 
      });
    }
    
    // Add user to request from in-memory
    const userId = sessions[token].userId;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    req.user = user;
    req.token = token;
    req.session = sessions[token];
    
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
app.get("/api/profile", authenticateUser, async (req, res) => {
  try {
    let userWithoutPassword;
    
    if (isMongoDBAvailable && req.user.toObject) {
      // MongoDB user
      const userObject = req.user.toObject();
      const { password, ...userData } = userObject;
      userWithoutPassword = userData;
    } else {
      // In-memory user
      const { password, ...userData } = req.user;
      userWithoutPassword = userData;
    }
    
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
app.get("/api/teammates", authenticateUser, async (req, res) => {
  try {
    // Get query parameters
    const { skill, availability, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isMongoDBAvailable) {
      try {
        // Build query filter
        let filter = {};
        
        if (skill) {
          filter.skills = { $regex: new RegExp(skill, 'i') };
        }
        
        if (availability) {
          filter.availability = { $regex: new RegExp(availability, 'i') };
        }
        
        // Pagination
        const skip = (pageNum - 1) * limitNum;
        
        // Find teammates with filters and pagination
        const teammates = await Teammate.find(filter)
          .skip(skip)
          .limit(limitNum);
        
        // Count total matching documents for pagination metadata
        const total = await Teammate.countDocuments(filter);
        
        // Response with pagination metadata
        return res.json({
          success: true,
          teammates,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        });
      } catch (mongoError) {
        console.error("MongoDB error during teammates fetch:", mongoError);
        // Fall back to in-memory if MongoDB operation fails
      }
    }
    
    // Fallback to in-memory storage
    // Filter teammates
    let filteredTeammates = [...inMemoryTeammates];
    
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
app.post("/api/logout", authenticateUser, async (req, res) => {
  try {
    const token = req.token;
    
    if (isMongoDBAvailable) {
      try {
        // Remove session from MongoDB
        await Session.deleteOne({ token });
      } catch (mongoError) {
        console.error("MongoDB error during logout:", mongoError);
      }
    }
    
    // Also clean from in-memory sessions
    if (sessions[token]) {
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
app.put("/api/profile", authenticateUser, async (req, res) => {
  try {
    const { fullName, bio, skills, availability } = req.body;
    const user = req.user;
    
    // Update user data
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (availability) user.availability = availability;
    
    if (isMongoDBAvailable && user.save) {
      // MongoDB user
      user.updatedAt = new Date();
      await user.save();
      
      // Return updated user without password
      const userObject = user.toObject();
      const { password, ...userWithoutPassword } = userObject;
      
      res.json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword
      });
    } else {
      // In-memory user
      user.updatedAt = new Date().toISOString();
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword
      });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile"
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

// API endpoint to view MongoDB data (for debugging)
app.get('/api/db-status', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = {
      mongoConnected: mongoose.connection.readyState === 1,
      collections: {}
    };
    
    // Only proceed if connected to MongoDB
    if (dbStatus.mongoConnected) {
      // Get users count and sample
      const userCount = await User.countDocuments();
      const userSample = await User.find().limit(5).lean();
      dbStatus.collections.users = {
        count: userCount,
        sample: userSample
      };
      
      // Get teammates count and sample
      const teammateCount = await Teammate.countDocuments();
      const teammateSample = await Teammate.find().limit(5).lean();
      dbStatus.collections.teammates = {
        count: teammateCount,
        sample: teammateSample
      };
      
      // Get sessions count
      const sessionCount = await Session.countDocuments();
      dbStatus.collections.sessions = {
        count: sessionCount
      };
    }
    
    res.json(dbStatus);
  } catch (error) {
    console.error('Error getting DB status:', error);
    res.status(500).json({ error: 'Failed to get database status', message: error.message });
  }
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

// Setup MongoDB models if connected
function setupMongoDBModels() {
  const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    skills: { type: [String], default: [] },
    bio: { type: String, default: "" },
    availability: { type: String, default: "Not specified" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
  });

  const sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  });

  const teammateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    skills: { type: [String], default: [] },
    availability: { type: String, default: "Not specified" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "https://randomuser.me/api/portraits/lego/1.jpg" }
  });

  User = mongoose.model('User', userSchema);
  Session = mongoose.model('Session', sessionSchema);
  Teammate = mongoose.model('Teammate', teammateSchema);
}

// Initialize database with sample data
async function initDatabase() {
  try {
    // Only seed if the collection is empty
    const teammatesCount = await Teammate.countDocuments();
    
    if (teammatesCount === 0) {
      console.log('🌱 Seeding database with sample data...');
      
      // Sample teammates data
      const sampleTeammates = [
        { 
          name: "Kushagra", 
          skills: ["Python", "Machine Learning", "AI", "game dev","c++","java"], 
          availability: "Now",
          bio: "helper with 5 years of experience",
          avatar: "https://static.vecteezy.com/system/resources/previews/008/451/344/non_2x/animal-head-goat-logo-icon-illustration-mascot-design-element-for-logo-poster-card-banner-emblem-t-shirt-illustration-vector.jpg"
        },
          { 
          name: "Krishna", 
          skills: ["Python", "Machine Learning", "AI","c++","java"], 
          availability: "Now",
          bio: "AI researcher with 5 years of experience",
          avatar: "https://drive.google.com/file/d/1qL_8dtN_sMbxCfAiEP9JamhMVh6E0oNu/view?usp=sharing",
        },
        { 
          name: "Alice Johnson", 
          skills: ["Python", "Machine Learning", "Data Science"], 
          availability: "Now",
          bio: "AI researcher with 5 years of experience",
          avatar: "https://randomuser.me/api/portraits/women/1.jpg"
        },
        { 
          name: "Bob Smith", 
          skills: ["JavaScript", "React", "UI/UX Design"], 
          availability: "Later Today",
          bio: "Frontend developer passionate about creating beautiful interfaces",
          avatar: "https://randomuser.me/api/portraits/men/2.jpg" 
        },
        { 
          name: "Charlie Davis", 
          skills: ["AI", "Design", "Project Management"], 
          availability: "This Weekend",
          bio: "Product designer with AI expertise",
          avatar: "https://randomuser.me/api/portraits/men/3.jpg"
        },
        { 
          name: "Diana Miller", 
          skills: ["Node.js", "MongoDB", "AWS"], 
          availability: "Next Week",
          bio: "Backend developer specialized in cloud architecture",
          avatar: "https://randomuser.me/api/portraits/women/4.jpg"
        },
        { 
          name: "Ethan Wilson", 
          skills: ["Mobile Dev", "Flutter", "Firebase"], 
          availability: "Now",
          bio: "Mobile app developer who loves creating cross-platform solutions",
          avatar: "https://randomuser.me/api/portraits/men/5.jpg"
        }
      ];
      
      try {
        await Teammate.insertMany(sampleTeammates);
        console.log('✅ Sample data seeded successfully!');
      } catch (insertError) {
        console.error('Error inserting sample data:', insertError);
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    // Don't throw error, just log it
  }
}

// Function to start the server
function startServer() {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`💾 Using ${isMongoDBAvailable ? 'MongoDB' : 'in-memory storage'}`);
  });
}

// Attempt to connect to MongoDB, but continue with in-memory data if not available
try {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quick-teams', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // 5-second timeout for server selection
  })
  .then(async () => {
    console.log('🔌 MongoDB Connected');
    isMongoDBAvailable = true;
    
    // Setup MongoDB models
    setupMongoDBModels();
    
    try {
      // Seed database with initial data
      await initDatabase();
    } catch (initError) {
      console.error('Error initializing database, continuing anyway:', initError);
    }
    
    startServer();
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.log('⚠️ Continuing with in-memory data storage only');
    
    // Populate the in-memory users array with sample data
    if (users.length === 0) {
      users.push({
        id: 1,
        fullName: 'Test User', 
        email: 'test@example.com', 
        password: hashPassword('password123'), 
        skills: ['JavaScript', 'React'],
        bio: "Test user for development",
        availability: "Now",
        createdAt: new Date()
      });
    }
    
    startServer();
  });
} catch (connectionError) {
  console.error('Error during MongoDB connection setup:', connectionError);
  console.log('⚠️ Continuing with in-memory data storage only');
  
  // Populate the in-memory users array with sample data
  if (users.length === 0) {
    users.push({
      id: 1,
      fullName: 'Test User', 
      email: 'test@example.com', 
      password: hashPassword('password123'), 
      skills: ['JavaScript', 'React'],
      bio: "Test user for development",
      availability: "Now",
      createdAt: new Date()
    });
  }
  
  startServer();
}
