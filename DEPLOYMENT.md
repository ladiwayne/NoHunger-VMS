# NoHunger VMS Deployment Guide

## Overview
This guide covers deploying the NoHunger Volunteer Management System to production.

## Prerequisites
- Docker and Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- MongoDB Atlas account (or self-hosted MongoDB)
- Reverse proxy (nginx recommended)

## Quick Deployment with Docker Compose

### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd nohunger-vms

# Copy environment files
cp backend/.env.example backend/.env
cp nohunger-frontend/.env.example nohunger-frontend/.env.local
```

### 2. Configure Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nohunger-vms?retryWrites=true&w=majority
JWT_SECRET=your-secure-jwt-secret-key-here-change-this
JWT_EXPIRE=7d
ALLOWED_ORIGINS=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_SITE_URL=https://your-frontend-domain.com
```

### 3. Build and Deploy
```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check service health
curl http://localhost:5000/health
curl http://localhost:3000
```

### 4. Event Link Generation (Important)

When admins create events/activities on the live server, check-in links are automatically generated. These links use the **`FRONTEND_URL`** environment variable to ensure they point to your live domain.

**Event link example:**
```
https://your-frontend-domain.com/checkin/ABC12345
```

**If `FRONTEND_URL` is not set**, links may fall back to:
- `NEXT_PUBLIC_APP_URL` environment variable
- Default production URL: `https://volunteer.nohungerfoodbank.org`
- **Important:** Do NOT leave this unset on your live server, or links may show localhost or wrong domain.

**To update after deployment:**
1. Modify the `FRONTEND_URL` in your `.env` file or Docker Compose
2. Restart the backend service: `docker-compose restart backend`
3. Test by creating a new event and verifying the link uses your correct domain

## Manual Deployment

### Backend Deployment
```bash
cd backend
npm install --production
npm run build  # if needed
npm start
```

### Frontend Deployment
```bash
cd nohunger-frontend
npm install
npm run build
npm run start
```

## Production Checklist

### Security
- [ ] Change all default passwords and secrets
- [ ] Use HTTPS with SSL certificate
- [ ] Configure CORS properly
- [ ] Set secure JWT secrets
- [ ] Enable rate limiting
- [ ] Configure firewall rules

### Performance
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging
- [ ] Configure database indexes
- [ ] Enable caching where appropriate

### Database
- [ ] Set up production MongoDB (Atlas recommended)
- [ ] Configure database backups
- [ ] Set up connection pooling
- [ ] Enable database authentication

### Infrastructure
- [ ] Set up reverse proxy (nginx)
- [ ] Configure load balancer if needed
- [ ] Set up monitoring (PM2, Docker monitoring)
- [ ] Configure auto-scaling if needed

## Environment Variables Reference

### Backend
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (production/development)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRE`: JWT expiration time
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SITE_URL`: Frontend site URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL (if used)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Troubleshooting

### Common Issues
1. **Database Connection Failed**: Check MongoDB URI and credentials
2. **CORS Errors**: Verify ALLOWED_ORIGINS configuration
3. **Build Failures**: Ensure all dependencies are installed
4. **Port Conflicts**: Check if ports 3000, 5000, 27017 are available

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

## Maintenance

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backups
- Database: Use MongoDB Atlas automated backups or mongodump
- Files: Backup uploaded files and configuration
- Environment: Document all environment variables

## Support
For deployment issues, check:
1. Docker logs for error messages
2. Network connectivity between services
3. Environment variable configuration
4. Database connectivity