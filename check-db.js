const mongoose = require('mongoose');

// Connection URI
const uri = 'mongodb://localhost:27017/quick-teams';

// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB!');
  
  // Define a User schema - this should match the one in your server.js
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

  // Create the User model
  const User = mongoose.model('User', userSchema);

  // Define a Teammate schema
  const teammateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    skills: { type: [String], default: [] },
    availability: { type: String, default: "Not specified" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "https://randomuser.me/api/portraits/lego/1.jpg" }
  });

  // Create the Teammate model
  const Teammate = mongoose.model('Teammate', teammateSchema);

  // Hash function for passwords (simple for testing)
  const hashPassword = (password) => {
    return require('crypto').createHash('sha256').update(password).digest('hex');
  };

  // Check if we need to seed test data
  return User.countDocuments().then(async count => {
    if (count === 0) {
      console.log('No users found. Adding test user...');
      
      // Create a test user
      const testUser = new User({
        fullName: 'Test User',
        email: 'test@example.com',
        password: hashPassword('password123'),
        skills: ['JavaScript', 'MongoDB'],
        bio: 'This is a test user',
        availability: 'Available',
        createdAt: new Date()
      });
      
      await testUser.save();
      console.log('Test user created successfully!');
      
      // Create test teammates if none exist
      const teammateCount = await Teammate.countDocuments();
      if (teammateCount === 0) {
        console.log('No teammates found. Adding test teammates...');
        
        const testTeammates = [
          {
            name: 'Jane Smith',
            skills: ['React', 'Node.js'],
            availability: 'Now',
            bio: 'Full-stack developer with 3 years of experience',
            avatar: 'https://randomuser.me/api/portraits/lego/3.jpg'
          },
          {
            name: 'John Doe',
            skills: ['Python', 'Machine Learning'],
            availability: 'Later Today',
            bio: 'Data scientist specializing in machine learning',
            avatar: 'https://randomuser.me/api/portraits/lego/4.jpg'
          }
        ];
        
        await Teammate.insertMany(testTeammates);
        console.log('Test teammates created successfully!');
      }
    }
    
    // Query all users
    const users = await User.find();
    console.log('Users in database:', users.length);
    console.log('User sample:', JSON.stringify(users.slice(0, 2), null, 2));
    
    // Query all teammates
    const teammates = await Teammate.find();
    console.log('Teammates in database:', teammates.length);
    console.log('Teammate sample:', JSON.stringify(teammates.slice(0, 2), null, 2));
    
    return { users, teammates };
  });
})
.then(() => {
  console.log('Database check complete!');
  process.exit(0);
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});
