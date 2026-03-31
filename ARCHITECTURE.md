# Architecture & Technical Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐ ┌────────────┐ │
│  │   Auth      │  │  Dashboards  │ │ Components │ │
│  │   Pages     │  │  (Admin/Vol) │ │  & Utils   │ │
│  └──────────────┘  └──────────────┘ └────────────┘ │
└────────────────────────────┬──────────────────────────┘
                             │
                    HTTP/REST API
                             │
┌────────────────────────────┴──────────────────────────┐
│             Backend (Express.js)                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │  API Routes                                      │ │
│  │  ├─ /auth      (registration, login)            │ │
│  │  ├─ /volunteers (profile, activities)           │ │
│  │  ├─ /activities (create, manage)                │ │
│  │  ├─ /events     (create, send invitations)      │ │
│  │  ├─ /checkins   (check-in/out, approval)        │ │
│  │  ├─ /invitations(accept/reject)                 │ │
│  │  ├─ /tasks      (create, assign, update)        │ │
│  │  └─ /admin      (statistics, approvals)         │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Middleware                                      │ │
│  │  ├─ Authentication (JWT)                        │ │
│  │  ├─ Authorization (Role-based)                  │ │
│  │  └─ Error Handling                              │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────┬──────────────────────────┘
                             │
                        MongoDB
                             │
┌────────────────────────────┴──────────────────────────┐
│              Database (MongoDB)                       │
│  ┌──────────────┐  ┌──────────────┐ ┌────────────┐  │
│  │    Users     │  │   Activities │ │   Events   │  │
│  │              │  │              │ │            │  │
│  │ - Profile    │  │ - Title      │ │ - Title    │  │
│  │ - Auth       │  │ - Check-in   │ │ - Check-in │  │
│  │ - Role       │  │ - Volunteers │ │ - Volunteers │
│  └──────────────┘  └──────────────┘ └────────────┘  │
│  ┌──────────────┐  ┌──────────────┐ ┌────────────┐  │
│  │  Check-Ins   │  │ Invitations  │ │   Tasks    │  │
│  │              │  │              │ │            │  │
│  │ - Time       │  │ - Event      │ │ - Title    │  │
│  │ - Hours      │  │ - Status     │ │ - Assigned │  │
│  │ - Status     │  │ - Volunteer  │ │ - Priority │  │
│  └──────────────┘  └──────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: 'volunteer' | 'admin',
  status: 'pending' | 'approved' | 'rejected',
  profilePicture: String,
  bio: String,
  skills: [String],
  totalVolunteeringHours: Number,
  appliedActivities: [ActivityId],
  approvedBy: UserId,
  isActive: Boolean,
  timestamps: { createdAt, updatedAt }
}
```

### Activity Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: 'outreach' | 'event' | 'project' | 'training',
  startDate: Date,
  endDate: Date,
  location: String,
  coordinatorId: UserId,
  volunteersNeeded: Number,
  volunteersApplied: [UserId],
  volunteersApproved: [UserId],
  checkInCode: String (unique),
  checkInLink: String (unique),
  status: 'draft' | 'published' | 'ongoing' | 'completed',
  image: String,
  requirements: [String],
  skills: [String],
  timestamps: { createdAt, updatedAt }
}
```

### Event Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  eventDate: Date,
  location: String,
  createdBy: UserId,
  invitedVolunteers: [UserId],
  acceptedVolunteers: [UserId],
  rejectedVolunteers: [UserId],
  checkInCode: String (unique),
  checkInLink: String (unique),
  status: 'draft' | 'published' | 'ongoing' | 'completed',
  image: String,
  timestamps: { createdAt, updatedAt }
}
```

### CheckIn Collection
```javascript
{
  _id: ObjectId,
  volunteerId: UserId,
  activityId: ActivityId,
  eventId: EventId,
  checkInTime: Date,
  checkOutTime: Date,
  hoursSpent: Number,
  checkInStatus: 'pending' | 'approved' | 'rejected',
  checkOutStatus: 'pending' | 'approved' | 'completed',
  approvedBy: UserId,
  notes: String,
  timestamps: { createdAt, updatedAt }
}
```

### Invitation Collection
```javascript
{
  _id: ObjectId,
  volunteerId: UserId,
  eventId: EventId,
  activityId: ActivityId,
  status: 'pending' | 'accepted' | 'rejected',
  invitedAt: Date,
  respondedAt: Date,
  message: String,
  timestamps: { createdAt, updatedAt }
}
```

### Task Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  assignedTo: UserId,
  assignedBy: UserId,
  activityId: ActivityId,
  eventId: EventId,
  priority: 'low' | 'medium' | 'high',
  dueDate: Date,
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
  completedAt: Date,
  notes: String,
  timestamps: { createdAt, updatedAt }
}
```

## Authentication Flow

```
┌──────────────────────────────────────────┐
│         Volunteer/Admin Registration     │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    POST /api/auth/register
    {
      firstName, lastName, email,
      password, phone, role
    }
                 │
                 ▼
    ┌─────────────────────────────┐
    │ Hash password with bcrypt   │
    │ Create User document        │
    │ Generate JWT token          │
    └─────────────────────────────┘
                 │
                 ▼
    Return token + user data
    Store token in localStorage

┌──────────────────────────────────────────┐
│          Volunteer/Admin Login           │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    POST /api/auth/login
    { email, password }
                 │
                 ▼
    ┌─────────────────────────────┐
    │ Find user by email          │
    │ Compare password with hash  │
    │ Generate JWT token          │
    └─────────────────────────────┘
                 │
                 ▼
    Return token + user data
    Store token in localStorage

┌──────────────────────────────────────────┐
│      Protected API Request               │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    Auth middleware:
    1. Extract token from header
    2. Verify token signature
    3. Decode token
    4. Add user to request
                 │
                 ▼
    Role Check:
    1. Check user role
    2. Allow/deny based on permission
                 │
                 ▼
    Proceed to route handler
```

## Check-in/Check-out Flow

```
Event Day:
┌──────────────────────────────────────────┐
│  Volunteer receives event details        │
│  with check-in link/code                 │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    Volunteer arrives at venue
    Clicks check-in button
                 │
                 ▼
    POST /api/checkins/checkin
    {
      volunteerId,
      activityId/eventId,
      checkInCode
    }
                 │
                 ▼
    ┌─────────────────────────────┐
    │ Create CheckIn record       │
    │ Set checkInTime = now()     │
    │ Set checkInStatus = pending │
    └─────────────────────────────┘
                 │
                 ▼
    Admin reviews check-in requests
                 │
                 ▼
    PUT /api/checkins/{id}/approve-checkin
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Set checkInStatus = approved │
    │ Set approvedBy = adminId     │
    └──────────────────────────────┘

After Event:
┌──────────────────────────────────────────┐
│  Volunteer clicks check-out button       │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    PUT /api/checkins/{id}/checkout
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ Set checkOutTime = now()         │
    │ Calculate hoursSpent             │
    │ Set checkOutStatus = pending     │
    └──────────────────────────────────┘
                 │
                 ▼
    Admin approves check-out
                 │
                 ▼
    PUT /api/checkins/{id}/approve-checkout
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │ Set checkOutStatus = completed       │
    │ Add hoursSpent to user.totalHours    │
    │ Update user profile                  │
    └──────────────────────────────────────┘
```

## Invitation Flow

```
Admin Creates Event/Activity:
┌──────────────────────────────────────────┐
│ POST /api/events                         │
│ POST /api/activities                     │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    Auto-generate:
    - checkInCode (UUID)
    - checkInLink (with code)

Send Invitations:
┌──────────────────────────────────────────┐
│ POST /api/events/{id}/send-invitations  │
│ { volunteerIds: [...] }                  │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ Create Invitation records          │
    │ Set status = 'pending'             │
    │ Add volunteers to invitedList      │
    └────────────────────────────────────┘

Volunteer Receives Invitation:
┌──────────────────────────────────────────┐
│ GET /api/invitations                     │
│ Returns pending invitations              │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    Display on Volunteer Dashboard

Volunteer Responds:
┌──────────────────────────────────────────┐
│ PUT /api/invitations/{id}/accept         │
│ PUT /api/invitations/{id}/reject         │
└────────────────┬─────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ Update invitation status           │
    │ Set respondedAt = now()            │
    │ Update acceptedVolunteers/rejected │
    └────────────────────────────────────┘
```

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (salt rounds: 10)
- Never stored in plain text
- Compared during login

### JWT Tokens
- Signed with secret key
- Includes user ID, email, role
- Expires after 7 days (configurable)
- Stored in localStorage (vulnerable to XSS)
  - Consider using HttpOnly cookies for production

### Role-Based Access Control
- Middleware checks user role
- Admin-only endpoints protected
- Volunteer endpoints protected
- Public endpoints: registration, login (with rate limiting recommended)

### Data Validation
- Input validation on all endpoints
- MongoDB schema validation
- Sanitization recommended for production

### Recommendations for Production
1. Use environment variables for secrets
2. Implement rate limiting
3. Use HTTPS only
4. Store tokens in HttpOnly cookies
5. Implement CORS properly
6. Add input sanitization (express-validator)
7. Implement logging and monitoring
8. Add database backups
9. Use reverse proxy (Nginx/Apache)
10. Implement DDoS protection

## Deployment Architecture (Recommended)

```
┌─────────────────────────────────────────┐
│         Client Browsers                 │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│         CDN / Load Balancer             │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│         Reverse Proxy (Nginx)           │
│  ├─ HTTPS/TLS                           │
│  ├─ CORS headers                        │
│  └─ Rate limiting                       │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────────┐  ┌──────────────────┐
│   Frontend       │  │   Backend        │
│   (Vercel/      │  │  (Heroku/AWS/    │
│    Netlify)     │  │   Railway/etc)   │
└──────────────────┘  └────────┬─────────┘
                               │
                   ┌───────────┴──────────┐
                   │                      │
                   ▼                      ▼
              ┌─────────────┐      ┌──────────────┐
              │  MongoDB    │      │  Redis Cache │
              │  (Atlas)    │      │  (optional)  │
              └─────────────┘      └──────────────┘
```

## Performance Optimization

### Backend
- Database indexing on frequently queried fields
- Connection pooling
- Caching with Redis (optional)
- Pagination for list endpoints
- Compression with gzip

### Frontend
- Code splitting with React.lazy()
- Memoization for expensive components
- Image optimization
- CSS-in-JS for smaller bundle
- Lazy loading for routes

## Monitoring & Logging

### Recommended Tools
- Sentry for error tracking
- LogRocket for session replay
- Datadog/New Relic for APM
- CloudWatch/Azure Monitor for infrastructure

---

**End of Architecture Documentation**
