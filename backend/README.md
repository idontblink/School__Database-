# PastPapers RIU - Backend API

Complete Node.js + Express backend for the PastPapers database system at Rosebank International University.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone and setup**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**
```bash
# Create PostgreSQL database
createdb pastpapers_db

# Run schema
psql pastpapers_db < database/schema.sql
```

4. **Start server**
```bash
npm run dev  # Development with nodemon
npm start    # Production
```

Server will run on `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Papers
- `GET /api/papers` - Get all approved papers (with filters)
- `GET /api/papers/:id` - Get single paper
- `POST /api/papers` - Upload new paper (requires auth)
- `POST /api/papers/:id/upvote` - Upvote paper
- `DELETE /api/papers/:id/upvote` - Remove upvote

### Bookmarks
- `GET /api/bookmarks` - Get user's bookmarks
- `POST /api/bookmarks/:paperId` - Bookmark paper
- `DELETE /api/bookmarks/:paperId` - Remove bookmark

### File Upload
- `POST /api/upload` - Upload file to S3/Cloudinary

### User Profile
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/uploads` - Get user's papers
- `PUT /api/users/:id` - Update profile

### Admin
- `GET /api/admin/papers/pending` - Get pending papers
- `POST /api/admin/papers/:id/approve` - Approve paper
- `POST /api/admin/papers/:id/reject` - Reject paper
- `GET /api/admin/stats` - Get system statistics

## 🔧 Configuration

### Database
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pastpapers_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### JWT
```env
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### File Storage (Choose one)

**AWS S3:**
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
AWS_REGION=us-east-1
```

**Cloudinary:**
```env
CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

## 📝 Example Requests

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Papers
```bash
curl http://localhost:3000/api/papers?department=Computer%20Science&year=2024&sort=upvotes
```

### Upload Paper
```bash
curl -X POST http://localhost:3000/api/papers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_code": "CSC101",
    "course_name": "Introduction to Programming",
    "department": "Computer Science",
    "year": 2024,
    "exam_type": "Finals",
    "file_url": "https://s3.amazonaws.com/...",
    "tags": ["important", "repeated"]
  }'
```

## 🧪 Testing

```bash
npm test
```

## 📦 Deployment

### Heroku
```bash
heroku create pastpapers-api
git push heroku main
heroku config:set JWT_SECRET=your_secret
heroku config:set DATABASE_URL=your_db_url
```

### Railway/Render
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

## 🔒 Security Notes

- Passwords are hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 7 days by default
- All file uploads validated by type and size
- Admin operations require authentication and admin flag
- Input validation on all endpoints

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **AWS S3 / Cloudinary** - File storage
- **Bcrypt** - Password hashing

## 📄 License

MIT
