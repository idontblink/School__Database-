# School__Database-
PastPapers RIU 📚
A crowdsourced past question bank for Rosebank International University students. Search, filter, bookmark, and upload past exam questions — all in one place.

What it does

Search past questions by course code, name, or keyword
Filter by department, year, and exam type (Finals, Midsem, Quiz)
Tag questions as Important, Repeated, or Hard
Bookmark papers to save them for later
Upload past questions for your courses (subject to admin review)
Upvote questions that were helpful


Tech Stack (Planned)
LayerTechnologyFrontendReact + Tailwind CSSBackendNode.js + ExpressDatabasePostgreSQLFile StorageCloudinary or AWS S3AuthJWT (signup/login)HostingVercel (frontend) + Railway (backend)

Features
Core

 Search by course code, name, keyword
 Filter by department, year, exam type
 Tag system (Important, Repeated, Hard, Has Answers)
 Bookmark / save questions
 Upload past questions (with file attach)
 Upvote system
 User profile

Coming Soon

 Admin moderation / approval queue
 "Most repeated questions" section
 PDF/image preview in-app
 Comments & discussion per paper
 Email notifications when new papers are uploaded for your courses
 Mobile app (React Native)


Project Structure (Planned)
pastpapers-riu/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Search, Bookmarks, Profile, Upload
│   │   └── hooks/           # Custom React hooks
├── server/                  # Node.js backend
│   ├── routes/              # API routes
│   ├── models/              # Database models
│   ├── middleware/          # Auth, file upload
│   └── controllers/         # Business logic
├── uploads/                 # Temp file storage (before S3)
└── README.md

Data Model
Each past question entry stores:
json{
  "id": "uuid",
  "courseCode": "CSC101",
  "courseName": "Introduction to Programming",
  "department": "Computer Science",
  "faculty": "Science & Technology",
  "year": 2024,
  "examType": "Finals",
  "fileUrl": "https://...",
  "hasAnswers": true,
  "tags": ["important", "repeated"],
  "uploadedBy": "user_id",
  "upvotes": 34,
  "approved": true,
  "createdAt": "2024-11-01T10:00:00Z"
}

Getting Started (Dev)
bash# Clone the repo
git clone https://github.com/your-username/pastpapers-riu.git
cd pastpapers-riu

# Install dependencies
cd client && npm install
cd ../server && npm install

# Set up environment variables
cp server/.env.example server/.env
# Fill in: DATABASE_URL, JWT_SECRET, CLOUDINARY_URL

# Run development servers
cd server && npm run dev       # API on http://localhost:5000
cd client && npm run dev       # Frontend on http://localhost:5173

Contributing
This project was started by Level 100 students at RIU. Contributions are welcome!

Fork the repo
Create a feature branch: git checkout -b feature/my-feature
Commit your changes: git commit -m "add my feature"
Push and open a Pull Request


License
MIT — free to use and build on.


Built with love for RIU students, by RIU students. 🎓
