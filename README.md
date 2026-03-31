# No Hunger Initiative Volunteer Management System

A comprehensive full-stack web application for managing volunteers, events, and volunteering hours for the No Hunger Initiative.

## Features

### Volunteer Features
- **User Registration & Login** - Secure authentication with JWT
- **Event/Outreach Invitations** - Receive and manage event invitations
- **Apply for Activities** - Browse and apply for volunteering activities
- **Check-in/Check-out** - Track volunteering hours with automatic calculation
- **View Volunteering Hours** - See total hours spent volunteering
- **Accept/Reject Invitations** - Manage event invitations

### Admin Features
- **Volunteer Management** - Approve/reject volunteer registrations
- **Activity Management** - Create and manage volunteering activities
- **Event Management** - Create events and send invitations to volunteers
- **Check-in Management** - Review and approve volunteer check-ins
- **Auto Check-in Links** - Automatically generated check-in codes and links for each activity
- **Task Management** - Create tasks and assign to volunteers
- **Dashboard** - View statistics: total volunteers, total projects, total hours
- **Volunteer Analytics** - View each volunteer and their total hours spent

## Tech Stack

### Frontend
- React 18
- React Router v6
- Axios for API calls
- CSS3 for styling

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nohunger-vms
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

4. Start the backend:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the frontend:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Volunteers
- `GET /api/volunteers` - Get all volunteers
- `GET /api/volunteers/:id` - Get volunteer profile
- `PUT /api/volunteers/:id` - Update volunteer profile
- `POST /api/volunteers/:id/apply-activity` - Apply for activity
- `GET /api/volunteers/:id/activities` - Get volunteer's activities

### Activities
- `POST /api/activities` - Create activity (admin only)
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get activity details
- `PUT /api/activities/:id` - Update activity (admin only)
- `POST /api/activities/:id/approve-volunteer` - Approve volunteer for activity

### Events
- `POST /api/events` - Create event (admin only)
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/send-invitations` - Send invitations (admin only)

### Check-ins
- `POST /api/checkins/checkin` - Check in volunteer
- `PUT /api/checkins/:id/checkout` - Check out volunteer
- `PUT /api/checkins/:id/approve-checkin` - Approve check-in (admin only)
- `PUT /api/checkins/:id/approve-checkout` - Approve check-out and update hours (admin only)
- `GET /api/checkins` - Get all check-ins

### Invitations
- `GET /api/invitations` - Get user's invitations
- `PUT /api/invitations/:id/accept` - Accept invitation
- `PUT /api/invitations/:id/reject` - Reject invitation

### Tasks
- `POST /api/tasks` - Create task (admin only)
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/assigned-to-me` - Get assigned tasks
- `PUT /api/tasks/:id/status` - Update task status

### Admin
- `GET /api/admin/dashboard/stats` - Get dashboard statistics (admin only)
- `PUT /api/admin/volunteers/:id/approve` - Approve volunteer (admin only)
- `PUT /api/admin/volunteers/:id/reject` - Reject volunteer (admin only)
- `GET /api/admin/volunteers/:id/hours` - Get volunteer hours (admin only)

## Project Structure

```
NoHunger VMS/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── adminAuth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Activity.js
│   │   ├── Event.js
│   │   ├── CheckIn.js
│   │   ├── Invitation.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── volunteers.js
│   │   ├── activities.js
│   │   ├── events.js
│   │   ├── checkins.js
│   │   ├── invitations.js
│   │   ├── tasks.js
│   │   └── admin.js
│   ├── utils/
│   │   └── helpers.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Auth.js
│   │   │   ├── VolunteerDashboard.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── styles/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── authContext.js
│   │   │   └── PrivateRoute.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## Usage

### Volunteer Workflow

1. **Register** - Create a new account
2. **Wait for Approval** - Admin will review and approve your account
3. **Check Invitations** - View pending event invitations
4. **Apply for Activities** - Browse and apply for volunteering activities
5. **Check-in on Event Day** - Use check-in link to log arrival
6. **Check-out** - Log departure time
7. **View Hours** - See your total volunteering hours

### Admin Workflow

1. **Login** - Admin account setup
2. **Manage Volunteers** - Approve/reject volunteer registrations
3. **Create Activities** - Set up volunteering activities with check-in codes
4. **Create Events** - Set up events and send invitations
5. **Monitor Check-ins** - Approve volunteer check-ins and check-outs
6. **Assign Tasks** - Create and assign tasks to volunteers
7. **View Analytics** - Monitor total volunteers, hours, and project statistics

## Security Features

- JWT token-based authentication
- Role-based access control (Admin/Volunteer)
- Password encryption with bcrypt
- Request validation
- Error handling

## Future Enhancements

- Email notifications for invitations
- Real-time notifications with WebSocket
- File uploads for volunteer documents
- Advanced analytics and reporting
- Mobile app
- Multi-language support
- Activity feedback and ratings
- Volunteer certificates

## License

MIT

## Support

For questions or issues, please contact the development team.
