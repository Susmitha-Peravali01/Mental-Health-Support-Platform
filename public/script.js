// Global variables
let currentUser = null
let currentCounselor = null
let resources = []
let journalPosts = []
let forumTopics = []
let moodEntries = []

// API Base URL
const API_BASE = "http://localhost:3000/api"

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  loadInitialData()
})

function initializeApp() {
  // Check if user is logged in
  const token = localStorage.getItem("token")
  if (token) {
    verifyToken(token)
  }

  setupNavigation()
  setupSliders()
}

function setupEventListeners() {
  // Hamburger menu
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("nav-menu")

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active")
    navMenu.classList.toggle("active")
  })

  // Resource filters
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
      e.target.classList.add("active")
      filterResources(e.target.dataset.category)
    })
  })

  // Modal close events
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none"
    }
  })
}

function setupNavigation() {
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
}

function setupSliders() {
  // Mood tracker sliders
  const sliders = ["mood", "energy", "stress"]
  sliders.forEach((slider) => {
    const range = document.getElementById(`${slider}-range`)
    const value = document.getElementById(`${slider}-value`)

    if (range && value) {
      range.addEventListener("input", (e) => {
        value.textContent = e.target.value
      })
    }
  })
}

// Authentication Functions
function showAuthModal() {
  document.getElementById("auth-modal").style.display = "block"
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Remove active class from all tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Show selected tab
  document.getElementById(tabName).classList.add("active")
  event.target.classList.add("active")
}

async function login(event) {
  event.preventDefault()
  const form = event.target
  const email = form.querySelector('input[type="email"]').value
  const password = form.querySelector('input[type="password"]').value

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("token", data.token)
      currentUser = data.user
      closeModal("auth-modal")
      showAlert("Login successful!", "success")
      updateUIForLoggedInUser()
    } else {
      showAlert(data.message || "Login failed", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showAlert("Login failed. Please try again.", "error")
  }
}

async function register(event) {
  event.preventDefault()
  const form = event.target
  const inputs = form.querySelectorAll("input, select")

  const userData = {
    firstName: inputs[0].value,
    lastName: inputs[1].value,
    email: inputs[2].value,
    university: inputs[3].value,
    academicYear: inputs[4].value,
    password: inputs[5].value,
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (response.ok) {
      showAlert("Registration successful! Please login.", "success")
      showTab("login")
    } else {
      showAlert(data.message || "Registration failed", "error")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showAlert("Registration failed. Please try again.", "error")
  }
}

async function adminLogin(event) {
  event.preventDefault()
  const form = event.target
  const email = form.querySelector('input[type="email"]').value
  const password = form.querySelector('input[type="password"]').value

  try {
    const response = await fetch(`${API_BASE}/auth/admin-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("token", data.token)
      currentUser = data.user
      closeModal("auth-modal")
      showAlert("Admin login successful!", "success")
      window.location.href = "/admin.html"
    } else {
      showAlert(data.message || "Admin login failed", "error")
    }
  } catch (error) {
    console.error("Admin login error:", error)
    showAlert("Admin login failed. Please try again.", "error")
  }
}

async function verifyToken(token) {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      currentUser = data.user
      updateUIForLoggedInUser()
    } else {
      localStorage.removeItem("token")
    }
  } catch (error) {
    console.error("Token verification error:", error)
    localStorage.removeItem("token")
  }
}

function updateUIForLoggedInUser() {
  const loginBtn = document.querySelector(".btn-login")
  if (loginBtn && currentUser) {
    loginBtn.textContent = `Hi, ${currentUser.firstName}`
    loginBtn.onclick = logout
  }
}

function logout() {
  localStorage.removeItem("token")
  currentUser = null
  location.reload()
}

// Resource Functions
async function loadInitialData() {
  await Promise.all([loadResources(), loadJournalPosts(), loadForumTopics(), loadMoodEntries(), loadCounselors()])
}

async function loadResources() {
  try {
    const response = await fetch(`${API_BASE}/resources`)
    const data = await response.json()

    if (response.ok) {
      resources = data
      displayResources(resources)
    }
  } catch (error) {
    console.error("Error loading resources:", error)
    loadSampleResources()
  }
}

function loadSampleResources() {
  resources = [
    {
      id: 1,
      title: "Managing Academic Stress: A Complete Guide",
      description: "Learn effective strategies to handle academic pressure and maintain mental wellness during exams.",
      type: "article",
      category: "stress",
      duration: "8 min read",
      rating: 4.8,
    },
    {
      id: 2,
      title: "Breathing Exercises for Anxiety Relief",
      description: "Guided breathing techniques to help calm anxiety and promote relaxation.",
      type: "video",
      category: "anxiety",
      duration: "12 min",
      rating: 4.9,
    },
    {
      id: 3,
      title: "Sleep Hygiene for Better Mental Health",
      description: "Understanding the connection between sleep and mental wellness, with practical tips.",
      type: "article",
      category: "sleep",
      duration: "6 min read",
      rating: 4.7,
    },
    {
      id: 4,
      title: "Meditation for Beginners",
      description: "A gentle introduction to mindfulness meditation practices for students.",
      type: "audio",
      category: "mindfulness",
      duration: "15 min",
      rating: 4.6,
    },
  ]
  displayResources(resources)
}

function displayResources(resourceList) {
  const grid = document.getElementById("resources-grid")
  if (!grid) return

  grid.innerHTML = resourceList
    .map(
      (resource) => `
        <div class="resource-card">
            <div class="resource-meta">
                <span class="resource-type type-${resource.type}">${resource.type}</span>
                <div class="resource-rating">
                    <i class="fas fa-star"></i>
                    <span>${resource.rating}</span>
                </div>
            </div>
            <h3>${resource.title}</h3>
            <p>${resource.description}</p>
            <div class="resource-meta">
                <span><i class="fas fa-clock"></i> ${resource.duration}</span>
                <button class="btn-primary" onclick="openResource(${resource.id})">Read More</button>
            </div>
        </div>
    `,
    )
    .join("")
}

function filterResources(category) {
  if (category === "all") {
    displayResources(resources)
  } else {
    const filtered = resources.filter((resource) => resource.category === category)
    displayResources(filtered)
  }
}

function openResource(resourceId) {
  const resource = resources.find((r) => r.id === resourceId)
  if (resource) {
    showAlert(`Opening: ${resource.title}`, "info")
  }
}

// Journal Functions
function showJournalModal() {
  document.getElementById("journal-modal").style.display = "block"
}

async function submitJournalEntry(event) {
  event.preventDefault()

  const mood = document.getElementById("mood-select").value
  const content = document.getElementById("journal-content").value

  if (!currentUser) {
    showAlert("Please login to share your feelings", "error")
    return
  }

  try {
    const response = await fetch(`${API_BASE}/journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ mood, content }),
    })

    const data = await response.json()

    if (response.ok) {
      showAlert("Your feelings have been shared anonymously!", "success")
      closeModal("journal-modal")
      document.getElementById("journal-content").value = ""
      document.getElementById("mood-select").value = ""
      loadJournalPosts()
    } else {
      showAlert(data.message || "Failed to share entry", "error")
    }
  } catch (error) {
    console.error("Error submitting journal entry:", error)
    showAlert("Failed to share entry. Please try again.", "error")
  }
}

async function loadJournalPosts() {
  try {
    const response = await fetch(`${API_BASE}/journal`)
    const data = await response.json()

    if (response.ok) {
      journalPosts = data
      displayJournalPosts(journalPosts)
    }
  } catch (error) {
    console.error("Error loading journal posts:", error)
    loadSampleJournalPosts()
  }
}

function loadSampleJournalPosts() {
  journalPosts = [
    {
      id: 1,
      content:
        "Today was really challenging with midterms coming up. I've been feeling overwhelmed with all the assignments, but I'm trying to take it one step at a time. Grateful for the support from my study group.",
      mood: "mixed",
      timestamp: "2 hours ago",
      reactions: { hearts: 12, thumbsUp: 8 },
      comments: 3,
    },
    {
      id: 2,
      content:
        "Had my first therapy session today and it went better than expected. Feeling hopeful about working through some of my anxiety issues. It's okay to ask for help.",
      mood: "positive",
      timestamp: "5 hours ago",
      reactions: { hearts: 24, thumbsUp: 15 },
      comments: 7,
    },
  ]
  displayJournalPosts(journalPosts)
}

function displayJournalPosts(posts) {
  const container = document.getElementById("journal-posts")
  if (!container) return

  container.innerHTML = posts
    .map(
      (post) => `
        <div class="journal-post">
            <div class="post-header">
                <div class="post-author">
                    <div class="avatar">A</div>
                    <div>
                        <strong>Anonymous Student</strong>
                        <div style="font-size: 0.9rem; color: #64748b;">${post.timestamp}</div>
                    </div>
                </div>
                <span class="mood-badge mood-${post.mood}">${post.mood}</span>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button class="action-btn" onclick="reactToPost(${post.id}, 'heart')">
                    <i class="fas fa-heart"></i> ${post.reactions.hearts}
                </button>
                <button class="action-btn" onclick="reactToPost(${post.id}, 'thumbsUp')">
                    <i class="fas fa-thumbs-up"></i> ${post.reactions.thumbsUp}
                </button>
                <button class="action-btn">
                    <i class="fas fa-comment"></i> ${post.comments}
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

async function reactToPost(postId, reactionType) {
  if (!currentUser) {
    showAlert("Please login to react to posts", "error")
    return
  }

  try {
    const response = await fetch(`${API_BASE}/journal/${postId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ reactionType }),
    })

    if (response.ok) {
      loadJournalPosts()
    }
  } catch (error) {
    console.error("Error reacting to post:", error)
  }
}

// Forum Functions
function showForumModal() {
  document.getElementById("forum-modal").style.display = "block"
}

async function submitForumTopic(event) {
  event.preventDefault()

  const title = document.getElementById("forum-title").value
  const category = document.getElementById("forum-category").value
  const content = document.getElementById("forum-content").value

  if (!currentUser) {
    showAlert("Please login to create discussions", "error")
    return
  }

  try {
    const response = await fetch(`${API_BASE}/forum`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ title, category, content }),
    })

    const data = await response.json()

    if (response.ok) {
      showAlert("Discussion created successfully!", "success")
      closeModal("forum-modal")
      document.getElementById("forum-title").value = ""
      document.getElementById("forum-category").value = ""
      document.getElementById("forum-content").value = ""
      loadForumTopics()
    } else {
      showAlert(data.message || "Failed to create discussion", "error")
    }
  } catch (error) {
    console.error("Error creating forum topic:", error)
    showAlert("Failed to create discussion. Please try again.", "error")
  }
}

async function loadForumTopics() {
  try {
    const response = await fetch(`${API_BASE}/forum`)
    const data = await response.json()

    if (response.ok) {
      forumTopics = data
      displayForumTopics(forumTopics)
    }
  } catch (error) {
    console.error("Error loading forum topics:", error)
    loadSampleForumTopics()
  }
}

function loadSampleForumTopics() {
  forumTopics = [
    {
      id: 1,
      title: "Dealing with Exam Anxiety",
      category: "anxiety",
      content: "How do you all cope with the stress and anxiety that comes with final exams?",
      author: "Anonymous",
      timestamp: "3 hours ago",
      replies: 15,
      views: 89,
    },
    {
      id: 2,
      title: "Finding Balance in Engineering School",
      category: "academic",
      content: "Struggling to balance coursework, projects, and personal life. Any tips?",
      author: "Anonymous",
      timestamp: "1 day ago",
      replies: 23,
      views: 156,
    },
  ]
  displayForumTopics(forumTopics)
}

function displayForumTopics(topics) {
  const container = document.getElementById("forum-topics")
  if (!container) return

  container.innerHTML = topics
    .map(
      (topic) => `
        <div class="forum-topic" onclick="openForumTopic(${topic.id})">
            <div class="topic-header">
                <span class="topic-category">${topic.category}</span>
                <div class="topic-stats">
                    <span><i class="fas fa-reply"></i> ${topic.replies}</span>
                    <span><i class="fas fa-eye"></i> ${topic.views}</span>
                </div>
            </div>
            <h3>${topic.title}</h3>
            <p>${topic.content}</p>
            <div style="font-size: 0.9rem; color: #64748b; margin-top: 1rem;">
                By ${topic.author} • ${topic.timestamp}
            </div>
        </div>
    `,
    )
    .join("")
}

function openForumTopic(topicId) {
  const topic = forumTopics.find((t) => t.id === topicId)
  if (topic) {
    showAlert(`Opening discussion: ${topic.title}`, "info")
  }
}

// Mood Tracker Functions
async function saveMoodEntry() {
  const mood = document.getElementById("mood-range").value
  const energy = document.getElementById("energy-range").value
  const stress = document.getElementById("stress-range").value
  const note = document.getElementById("mood-note").value

  if (!currentUser) {
    showAlert("Please login to save mood entries", "error")
    return
  }

  try {
    const response = await fetch(`${API_BASE}/mood`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ mood, energy, stress, note }),
    })

    const data = await response.json()

    if (response.ok) {
      showAlert("Mood entry saved successfully!", "success")
      document.getElementById("mood-note").value = ""
      loadMoodEntries()
    } else {
      showAlert(data.message || "Failed to save mood entry", "error")
    }
  } catch (error) {
    console.error("Error saving mood entry:", error)
    showAlert("Failed to save mood entry. Please try again.", "error")
  }
}

async function loadMoodEntries() {
  if (!currentUser) return

  try {
    const response = await fetch(`${API_BASE}/mood`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      moodEntries = data
      displayMoodHistory(moodEntries)
    }
  } catch (error) {
    console.error("Error loading mood entries:", error)
    loadSampleMoodEntries()
  }
}

function loadSampleMoodEntries() {
  moodEntries = [
    { date: "2024-01-15", mood: 8, energy: 7, stress: 3, note: "Great day!" },
    { date: "2024-01-14", mood: 6, energy: 5, stress: 6, note: "Feeling overwhelmed" },
    { date: "2024-01-13", mood: 9, energy: 8, stress: 2, note: "Amazing sleep!" },
  ]
  displayMoodHistory(moodEntries)
}

function displayMoodHistory(entries) {
  const container = document.getElementById("mood-history")
  if (!container) return

  container.innerHTML = `
        <h3>Recent Mood History</h3>
        ${entries
          .map(
            (entry) => `
            <div class="mood-entry">
                <div class="mood-date">${new Date(entry.date).toLocaleDateString()}</div>
                <div class="mood-values">
                    <span class="mood-value" style="background: #dcfce7; color: #166534;">M: ${entry.mood}</span>
                    <span class="mood-value" style="background: #fef3c7; color: #92400e;">E: ${entry.energy}</span>
                    <span class="mood-value" style="background: #fecaca; color: #991b1b;">S: ${entry.stress}</span>
                </div>
            </div>
        `,
          )
          .join("")}
    `
}

// Chat Functions
async function loadCounselors() {
  try {
    const response = await fetch(`${API_BASE}/counselors`)
    const data = await response.json()

    if (response.ok) {
      displayCounselors(data)
    }
  } catch (error) {
    console.error("Error loading counselors:", error)
    loadSampleCounselors()
  }
}

function loadSampleCounselors() {
  const counselors = [
    { id: 1, name: "Dr. Sarah Johnson", specialty: "Anxiety & Stress", status: "online" },
    { id: 2, name: "Dr. Michael Chen", specialty: "Depression Support", status: "online" },
    { id: 3, name: "Dr. Emily Davis", specialty: "Academic Counseling", status: "away" },
  ]
  displayCounselors(counselors)
}

function displayCounselors(counselors) {
  const container = document.getElementById("counselor-list")
  if (!container) return

  container.innerHTML = counselors
    .map(
      (counselor) => `
        <div class="counselor-item" onclick="selectCounselor(${counselor.id}, '${counselor.name}')">
            <div class="counselor-avatar">${counselor.name.charAt(0)}</div>
            <div class="counselor-info">
                <h4>${counselor.name}</h4>
                <div class="counselor-status">${counselor.specialty} • ${counselor.status}</div>
            </div>
        </div>
    `,
    )
    .join("")
}

function selectCounselor(counselorId, counselorName) {
  currentCounselor = { id: counselorId, name: counselorName }

  // Update UI
  document.querySelectorAll(".counselor-item").forEach((item) => {
    item.classList.remove("active")
  })
  event.currentTarget.classList.add("active")

  // Clear chat and show welcome message
  const chatMessages = document.getElementById("chat-messages")
  chatMessages.innerHTML = `
        <div class="welcome-message">
            <p>You are now chatting with ${counselorName}. This conversation is private and confidential.</p>
        </div>
    `
}

function sendMessage() {
  const input = document.getElementById("message-input")
  const message = input.value.trim()

  if (!message || !currentCounselor) return

  if (!currentUser) {
    showAlert("Please login to chat with counselors", "error")
    return
  }

  // Add message to chat
  addMessageToChat(message, "sent")
  input.value = ""

  // Simulate counselor response
  setTimeout(
    () => {
      const responses = [
        "Thank you for sharing that with me. How are you feeling right now?",
        "I understand this can be challenging. Can you tell me more about what's been on your mind?",
        "It's completely normal to feel this way. What coping strategies have you tried so far?",
        "I'm here to listen and support you. What would be most helpful for you right now?",
        "That sounds really difficult. How long have you been experiencing these feelings?",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      addMessageToChat(randomResponse, "received")
    },
    1000 + Math.random() * 2000,
  )
}

function addMessageToChat(message, type) {
  const chatMessages = document.getElementById("chat-messages")
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `
  chatMessages.appendChild(messageDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

// Utility Functions
function showAlert(message, type) {
  // Remove existing alerts
  const existingAlert = document.querySelector(".alert")
  if (existingAlert) {
    existingAlert.remove()
  }

  // Create new alert
  const alert = document.createElement("div")
  alert.className = `alert alert-${type}`
  alert.textContent = message

  // Insert at top of body
  document.body.insertBefore(alert, document.body.firstChild)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove()
    }
  }, 5000)
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId)
  if (section) {
    section.scrollIntoView({ behavior: "smooth" })
  }
}