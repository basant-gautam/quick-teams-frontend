const mongoose = require('mongoose');
require('dotenv').config();

// Connection to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quick-teams', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB!');
  addNewTeammates();
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

// Define the Teammate schema
const teammateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  skills: { type: [String], default: [] },
  availability: { type: String, default: "Not specified" },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "https://randomuser.me/api/portraits/lego/1.jpg" }
});

// Create the model
const Teammate = mongoose.model('Teammate', teammateSchema);

// Function to add new teammates
async function addNewTeammates() {
  try {
    // New teammates data
    const newTeammates = [
      { 
        name: "Kushagra", 
        skills: ["Python", "Machine Learning", "AI", "game dev", "c plus plus", "java"], 
        availability: "Now",
        bio: "helper with 5 years of experience",
        avatar: "https://randomuser.me/api/portraits/lego/1.jpg"
      },
      { 
        name: "Krishna", 
        skills: ["Python", "Machine Learning", "AI", "c plus plus", "java"], 
        availability: "Now",
        bio: "AI researcher with 5 years of experience",
        avatar: "https://randomuser.me/api/portraits/lego/2.jpg"
      }
    ];

    // Note: Changed "c++" to "c plus plus" to avoid regex issues in search

    // Check if these teammates already exist to avoid duplicates
    for (const teammate of newTeammates) {
      const existingTeammate = await Teammate.findOne({ name: teammate.name });
      
      if (existingTeammate) {
        console.log(`Teammate ${teammate.name} already exists, skipping...`);
      } else {
        // Create new teammate
        const newTeammate = new Teammate(teammate);
        await newTeammate.save();
        console.log(`Added new teammate: ${teammate.name}`);
      }
    }

    console.log('Finished adding teammates!');
    
    // Display all teammates
    const allTeammates = await Teammate.find();
    console.log(`Total teammates in database: ${allTeammates.length}`);
    console.log('All teammate names:');
    allTeammates.forEach(teammate => {
      console.log(`- ${teammate.name} (Skills: ${teammate.skills.join(', ')})`);
    });
    
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error adding teammates:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
