# Quick Start Guide

## Getting Started with No Hunger VMS

This guide will help you set up and run the No Hunger Initiative Volunteer Management System.

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** (optional) - [Download](https://git-scm.com/)

## Step-by-Step Setup

### 1. Backend Setup

#### 1.1 Navigate to backend directory
```bash
cd backend
```

#### 1.2 Install dependencies
```bash
npm install
```

#### 1.3 Create environment file
Create a file named `.env` in the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nohunger-vms
JWT_SECRET=your_secure_jwt_secret_key_here_change_this
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Note:** If using MongoDB Atlas (cloud), replace the `MONGODB_URI` with your connection string.

#### 1.4 Start the backend server
```bash
npm run dev
```

You should see:
```
Server is running on port 5000
MongoDB connected: localhost
```

### 2. Frontend Setup

#### 2.1 Open a new terminal and navigate to frontend directory
```bash
cd frontend
```

#### 2.2 Install dependencies
```bash
npm install
```

#### 2.3 Create environment file
Create a file named `.env` in the frontend folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### 2.4 Start the React development server
```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

## Testing the Application

### 1. Create a Volunteer Account
- Go to `http://localhost:3000/register`
- Fill in the registration form
- Select "Volunteer" as the role
- Click Register

### 2. Create an Admin Account (for testing)
- Go to `http://localhost:3000/register`
- Fill in the registration form
- Select "Admin" as the role
- Click Register

### 3. Login
- Navigate to `http://localhost:3000/login`
- Use the credentials you just created

### 4. Explore Features

#### As a Volunteer:
- View the volunteer dashboard
- See pending invitations
- Browse available activities
- Apply for activities

#### As an Admin:
- View dashboard statistics
- Manage volunteers (approve/reject)
- View volunteer list
- Manage activities

## Troubleshooting

### MongoDB Connection Error
If you get a MongoDB connection error:
1. Ensure MongoDB is running (`mongod` command)
2. Check your `MONGODB_URI` in `.env`
3. For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
If port 5000 or 3000 is already in use:
- Change the port in `.env` file
- Or kill the process using the port

### API Connection Error
If the frontend can't connect to the backend:
1. Ensure backend is running on port 5000
2. Check `REACT_APP_API_URL` in frontend `.env`
3. Check browser console for errors

### Module Not Found
If you get module errors:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Project Structure Overview

```
NoHunger VMS/
├── backend/          # Express.js API server
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth & validation
│   └── utils/        # Helper functions
│
├── frontend/         # React application
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── utils/    # Context & helpers
│   │   └── services/ # API client
│   └── public/
│
└── README.md        # Full documentation
```

## Key Features

### For Volunteers
✅ User Registration & Login
✅ View Event Invitations
✅ Apply for Activities
✅ Check-in/Check-out for Events
✅ View Volunteering Hours
✅ Accept/Reject Invitations

### For Admins
✅ Dashboard with Statistics
✅ Approve/Reject Volunteers
✅ Create Volunteering Activities
✅ Create Events & Send Invitations
✅ Manage Check-ins/Check-outs
✅ Create & Assign Tasks
✅ View Volunteer Analytics

## API Documentation

All API endpoints are documented in the [API Endpoints](README.md#api-endpoints) section of the main README.

## Development Tips

### Common Workflows

#### Create a New Activity (Admin)
1. Login as Admin
2. Go to Activities tab
3. Click "Create Activity"
4. Fill in details (auto-generates check-in code)
5. Save

#### Approve a Volunteer (Admin)
1. Go to Volunteers tab
2. Find pending volunteer
3. Click "Approve" button
4. Volunteer status changes to "approved"

#### Apply for Activity (Volunteer)
1. Login as Volunteer
2. Browse Available Activities
3. Click "Apply"
4. Wait for admin approval

#### Check-in to Event (Volunteer)
1. On event day, use the check-in link
2. Click "Check In"
3. After event, click "Check Out"
4. Hours will be automatically calculated

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | localhost |
| JWT_SECRET | JWT signing secret | your_key |
| JWT_EXPIRE | Token expiration time | 7d |
| NODE_ENV | Environment | development |
| FRONTEND_URL | Frontend URL for check-in links | http://localhost:3000 |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |

## Next Steps

1. **Customize Styling** - Modify CSS files in `frontend/src/pages/styles/`
2. **Add Email Notifications** - Integrate a mail service
3. **Deploy** - Deploy to Heroku, Vercel, or your preferred platform
4. **Add More Features** - Ratings, certificates, real-time notifications
5. **Mobile App** - Build a React Native version

## Support & Documentation

- See [README.md](README.md) for full documentation
- Check API endpoints in [API Endpoints](README.md#api-endpoints)
- Review project structure in [Project Structure](README.md#project-structure)

## License

MIT

---

**Happy volunteering! 🎉**
