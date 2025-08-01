const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const path = require("path")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://tejaperavali0:ay60UKypGFYjVMVp@cluster01.3oyz6c9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01/mindspace"

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  university: { type: String, required: true },
  academicYear: { type: String, required: true },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)

// Resource Schema
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ["article", "video", "audio", "guide"], required: true },
  category: { type: String, required: true },
  duration: { type: String, required: true },
  rating: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
})

const Resource = mongoose.model("Resource", resourceSchema)

// Journal Entry Schema
const journalSchema = new mongoose.Schema({
  content: { type: String, required: true },
  mood: { type: String, enum: ["positive", "mixed", "negative"], required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reactions: {
    hearts: { type: Number, default: 0 },
    thumbsUp: { type: Number, default: 0 },
  },
  comments: [
    {
      content: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
})

const JournalEntry = mongoose.model("JournalEntry", journalSchema)

// Forum Topic Schema
const forumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  replies: [
    {
      content: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

const ForumTopic = mongoose.model("ForumTopic", forumSchema)

// Mood Entry Schema
const moodSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mood: { type: Number, required: true, min: 1, max: 10 },
  energy: { type: Number, required: true, min: 1, max: 10 },
  stress: { type: Number, required: true, min: 1, max: 10 },
  note: { type: String },
  date: { type: Date, default: Date.now },
})

const MoodEntry = mongoose.model("MoodEntry", moodSchema)

// Counselor Schema
const counselorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  specialty: { type: String, required: true },
  bio: { type: String },
  status: { type: String, enum: ["online", "away", "offline"], default: "offline" },
  createdAt: { type: Date, default: Date.now },
})

const Counselor = mongoose.model("Counselor", counselorSchema)

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, university, academicYear } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      university,
      academicYear,
    })

    await user.save()
    res.status(201).json({ message: "User registered successfully" })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email, role: "admin" })
    if (!user) {
      return res.status(400).json({ message: "Invalid admin credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid admin credentials" })
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({ message: "Server error during admin login" })
  }
})

app.get("/api/auth/verify", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    res.json({ user })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Resource Routes
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 })
    res.json(resources)
  } catch (error) {
    console.error("Error fetching resources:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/resources", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, content, type, category, duration } = req.body

    const resource = new Resource({
      title,
      description,
      content,
      type,
      category,
      duration,
      createdBy: req.user.userId,
    })

    await resource.save()
    res.status(201).json(resource)
  } catch (error) {
    console.error("Error creating resource:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Journal Routes
app.get("/api/journal", async (req, res) => {
  try {
    const entries = await JournalEntry.find().sort({ createdAt: -1 }).limit(20).select("-author")

    const formattedEntries = entries.map((entry) => ({
      id: entry._id,
      content: entry.content,
      mood: entry.mood,
      reactions: entry.reactions,
      comments: entry.comments.length,
      timestamp: getTimeAgo(entry.createdAt),
    }))

    res.json(formattedEntries)
  } catch (error) {
    console.error("Error fetching journal entries:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/journal", authenticateToken, async (req, res) => {
  try {
    const { content, mood } = req.body

    const entry = new JournalEntry({
      content,
      mood,
      author: req.user.userId,
    })

    await entry.save()
    res.status(201).json({ message: "Journal entry created successfully" })
  } catch (error) {
    console.error("Error creating journal entry:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/journal/:id/react", authenticateToken, async (req, res) => {
  try {
    const { reactionType } = req.body
    const entryId = req.params.id

    const entry = await JournalEntry.findById(entryId)
    if (!entry) {
      return res.status(404).json({ message: "Journal entry not found" })
    }

    if (reactionType === "heart") {
      entry.reactions.hearts += 1
    } else if (reactionType === "thumbsUp") {
      entry.reactions.thumbsUp += 1
    }

    await entry.save()
    res.json({ message: "Reaction added successfully" })
  } catch (error) {
    console.error("Error adding reaction:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Forum Routes
app.get("/api/forum", async (req, res) => {
  try {
    const topics = await ForumTopic.find().sort({ createdAt: -1 }).limit(20).select("-author")

    const formattedTopics = topics.map((topic) => ({
      id: topic._id,
      title: topic.title,
      content: topic.content,
      category: topic.category,
      replies: topic.replies.length,
      views: topic.views,
      timestamp: getTimeAgo(topic.createdAt),
      author: "Anonymous",
    }))

    res.json(formattedTopics)
  } catch (error) {
    console.error("Error fetching forum topics:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/forum", authenticateToken, async (req, res) => {
  try {
    const { title, content, category } = req.body

    const topic = new ForumTopic({
      title,
      content,
      category,
      author: req.user.userId,
    })

    await topic.save()
    res.status(201).json({ message: "Forum topic created successfully" })
  } catch (error) {
    console.error("Error creating forum topic:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mood Tracker Routes
app.get("/api/mood", authenticateToken, async (req, res) => {
  try {
    const entries = await MoodEntry.find({ user: req.user.userId }).sort({ date: -1 }).limit(30)

    res.json(entries)
  } catch (error) {
    console.error("Error fetching mood entries:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/mood", authenticateToken, async (req, res) => {
  try {
    const { mood, energy, stress, note } = req.body

    const entry = new MoodEntry({
      user: req.user.userId,
      mood: Number.parseInt(mood),
      energy: Number.parseInt(energy),
      stress: Number.parseInt(stress),
      note,
    })

    await entry.save()
    res.status(201).json({ message: "Mood entry saved successfully" })
  } catch (error) {
    console.error("Error saving mood entry:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Counselor Routes
app.get("/api/counselors", async (req, res) => {
  try {
    const counselors = await Counselor.find().select("-email")
    res.json(counselors)
  } catch (error) {
    console.error("Error fetching counselors:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin Routes
app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.countDocuments({ role: "student" })
    const journalEntries = await JournalEntry.countDocuments()
    const forumTopics = await ForumTopic.countDocuments()
    const resources = await Resource.countDocuments()

    res.json({
      users,
      journalEntries,
      forumTopics,
      resources,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Utility function
function getTimeAgo(date) {
  const now = new Date()
  const diffInMs = now - date
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInHours < 1) {
    return "Just now"
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  } else {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  }
}

// Serve admin page
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"))
})

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Initialize sample data
async function initializeSampleData() {
  try {
    // Create admin user if doesn't exist
    const adminExists = await User.findOne({ email: "admin@mindspace.com" })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      const admin = new User({
        firstName: "Admin",
        lastName: "User",
        email: "admin@mindspace.com",
        password: hashedPassword,
        university: "MindSpace",
        academicYear: "N/A",
        role: "admin",
      })
      await admin.save()
      console.log("Admin user created: admin@mindspace.com / admin123")
    }

    // Create sample counselors
    const counselorCount = await Counselor.countDocuments()
    if (counselorCount === 0) {
      const sampleCounselors = [
        {
          name: "Dr. Sarah Johnson",
          email: "sarah@mindspace.com",
          specialty: "Anxiety & Stress Management",
          bio: "Specialized in helping students manage academic stress and anxiety.",
          status: "online",
        },
        {
          name: "Dr. Michael Chen",
          email: "michael@mindspace.com",
          specialty: "Depression Support",
          bio: "Experienced in supporting students through depression and mood disorders.",
          status: "online",
        },
        {
          name: "Dr. Emily Davis",
          email: "emily@mindspace.com",
          specialty: "Academic Counseling",
          bio: "Helps students with academic pressure and career guidance.",
          status: "away",
        },
      ]

      await Counselor.insertMany(sampleCounselors)
      console.log("Sample counselors created")
    }

    // Create sample resources
    const resourceCount = await Resource.countDocuments()
    if (resourceCount === 0) {
      const sampleResources = [
        {
          title: "Managing Academic Stress: A Complete Guide",
          description:
            "Learn effective strategies to handle academic pressure and maintain mental wellness during exams.",
          content: "Detailed guide content here...",
          type: "article",
          category: "stress",
          duration: "8 min read",
          rating: 4.8,
        },
        {
          title: "Breathing Exercises for Anxiety Relief",
          description: "Guided breathing techniques to help calm anxiety and promote relaxation.",
          content: "Video content here...",
          type: "video",
          category: "anxiety",
          duration: "12 min",
          rating: 4.9,
        },
        {
          title: "Sleep Hygiene for Better Mental Health",
          description: "Understanding the connection between sleep and mental wellness, with practical tips.",
          content: "Article content here...",
          type: "article",
          category: "sleep",
          duration: "6 min read",
          rating: 4.7,
        },
        {
          title: "Meditation for Beginners",
          description: "A gentle introduction to mindfulness meditation practices for students.",
          content: "Audio content here...",
          type: "audio",
          category: "mindfulness",
          duration: "15 min",
          rating: 4.6,
        },
      ]

      await Resource.insertMany(sampleResources)
      console.log("Sample resources created")
    }
  } catch (error) {
    console.error("Error initializing sample data:", error)
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Visit: http://localhost:${PORT}`)
  initializeSampleData()
})