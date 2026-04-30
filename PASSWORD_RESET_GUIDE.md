# Password Reset Implementation Guide

## 🎯 Overview

The application now supports **JWT-based password reset** without requiring external email services. Users can securely reset their passwords using time-limited tokens.

---

## 📋 How It Works

### **Step-by-Step Flow**

1. **User clicks "Forgot Password"** on login page
2. **Enters email address** → Frontend validates email format
3. **Backend generates reset token** → JWT token valid for 1 hour
4. **User receives reset link** (in development, link is logged to console)
5. **User clicks reset link** → Navigates to `/reset-password?token=xxx`
6. **Token is verified** → Reset page validates token validity
7. **User sets new password** → Must be 8+ characters with uppercase letter
8. **Password is updated** → Old password hashed, token marked as used
9. **Redirect to login** → User signs in with new password

---

## 🔒 Security Features

### **Token Security**
- **JWT-based**: Tokens are digitally signed using server secret
- **Time-limited**: Tokens expire after 1 hour
- **One-time use**: Token is marked as used after password change
- **Cannot be reused**: Attempting to use same token twice fails

### **Password Validation**
- **Minimum 8 characters**: Prevents weak passwords
- **Uppercase letter required**: Increases password complexity
- **Confirmation required**: User must match new password twice
- **Bcrypt hashing**: Passwords are never stored in plain text

### **User Privacy**
- **No email leakage**: Frontend never reveals if email exists in system
- **Generic error messages**: "If that email is in our system..." message same for existing/non-existing emails
- **Rate limiting**: Login attempts limited to prevent brute force

---

## 🏗️ API Endpoints

### **1. POST `/api/auth/forgot-password`**

**Purpose**: Request a password reset link

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Development):**
```json
{
  "message": "Password reset link generated",
  "resetToken": "eyJhbGc...",
  "resetLink": "http://localhost:4028/reset-password?token=eyJhbGc...",
  "expiresIn": "1 hour"
}
```

**Response (Production):**
```json
{
  "message": "If that email address is in our system, you will receive a password reset link."
}
```

---

### **2. POST `/api/auth/verify-reset-token`**

**Purpose**: Verify that a reset token is still valid

**Request:**
```json
{
  "token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "message": "Token is valid",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Error Cases:**
- `400`: Invalid token (malformed or tampered)
- `400`: Token expired (older than 1 hour)
- `400`: Token already used

---

### **3. POST `/api/auth/reset-password`**

**Purpose**: Reset password using a valid token

**Request:**
```json
{
  "token": "eyJhbGc...",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Response:**
```json
{
  "message": "Password has been successfully reset. Please sign in with your new password."
}
```

**Validation:**
- Token must be valid and not previously used
- Password must be 8+ characters
- Password must contain uppercase letter
- Password and confirmPassword must match

---

## 💻 Frontend Usage

### **Request Password Reset**

```typescript
import { requestPasswordReset } from '@/lib/api/password-reset';

try {
  const response = await requestPasswordReset('user@example.com');
  console.log('Reset link:', response.resetLink); // Dev only
  toast.success('Check your email for reset link');
} catch (error) {
  toast.error('Failed to request password reset');
}
```

### **Verify Reset Token**

```typescript
import { verifyResetToken } from '@/lib/api/password-reset';

try {
  const result = await verifyResetToken(token);
  console.log('Token is valid for:', result.email);
} catch (error) {
  console.error('Token is invalid or expired');
}
```

### **Reset Password**

```typescript
import { resetPassword } from '@/lib/api/password-reset';

try {
  const result = await resetPassword(token, newPassword, confirmPassword);
  toast.success('Password reset successful!');
  router.push('/sign-up-login-screen');
} catch (error) {
  toast.error('Failed to reset password');
}
```

---

## 🔧 Backend Implementation

### **Token Storage**

Tokens are stored in-memory using a Map:

```javascript
const resetTokens = new Map();

resetTokens.set(token, {
  userId: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  expiresAt: 1719504000000,
  used: false
});
```

### **Automatic Cleanup**

Expired tokens are automatically removed every 10 minutes:

```javascript
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
}, 10 * 60 * 1000);
```

---

## 📊 Development vs Production

### **Development Mode**

```
✅ Reset link is logged to console
✅ Reset token is returned in API response
✅ No email service needed
✅ Fast testing and debugging
```

### **Production Mode**

```
✅ Reset link must be sent via email service
✅ Reset token NOT returned to frontend
✅ Generic success message for privacy
✅ Requires integration with email provider
```

---

## 🚀 Future Improvements

### **Email Integration**

To send actual emails in production:

```javascript
// In forgot-password endpoint
if (process.env.NODE_ENV === 'production') {
  // Send email with reset link
  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password',
    template: 'password-reset',
    context: { resetLink }
  });
}
```

### **Redis Integration**

Replace in-memory storage with Redis for distributed systems:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Store reset token in Redis with TTL
await client.setex(`reset:${token}`, 3600, JSON.stringify(tokenData));
```

### **SMS-Based Tokens**

Alternatively, send OTP via SMS:

```javascript
// Generate 6-digit code
const otp = Math.random().toString().substring(2, 8);

// Store temporarily
resetTokens.set(otp, { userId, expiresAt: Date.now() + 600000 });

// Send via SMS provider
await twilioClient.messages.create({
  to: user.phone,
  body: `Your password reset code: ${otp}`
});
```

---

## 🧪 Testing

### **Development Workflow**

1. Start backend: `npm start` (in backend folder)
2. Start frontend: `npm run dev` (in frontend folder)
3. Navigate to login page
4. Click "Forgot Password"
5. Enter test email
6. Check backend console for reset link
7. Copy reset link to browser
8. Set new password
9. Try logging in with new password

### **Manual Testing Checklist**

- [ ] Forgot password form validates email
- [ ] Sending request with invalid email shows error
- [ ] Sending request with non-existent email shows success (privacy)
- [ ] Sending request with valid email shows success
- [ ] Console shows reset link in development
- [ ] Reset link works when valid
- [ ] Reset link fails when expired (>1 hour)
- [ ] Reset link fails when already used
- [ ] New password must be 8+ characters
- [ ] New password must contain uppercase letter
- [ ] Passwords must match
- [ ] After reset, old password no longer works
- [ ] After reset, new password works for login

---

## 📄 File Changes Summary

### **Backend**
- **`backend/routes/auth.js`**: Added 3 new endpoints
  - `/forgot-password`: Request reset token
  - `/verify-reset-token`: Validate token
  - `/reset-password`: Reset password

### **Frontend**
- **`src/lib/api/password-reset.ts`**: New API functions
  - `requestPasswordReset()`
  - `verifyResetToken()`
  - `resetPassword()`

- **`src/app/sign-up-login-screen/components/SignUpLoginContent.tsx`**: Updated
  - `handleForgotPassword()`: Now calls backend API

- **`src/app/reset-password/page.tsx`**: Updated
  - `onSubmit()`: Now resets password using API
  - Added `useSearchParams` for token extraction

---

## ⚠️ Important Notes

1. **In-Memory Storage**: Currently uses Map, will be lost on server restart. For production, use Redis or database.

2. **Token Expiry**: Set to 1 hour. Can be adjusted in JWT signature:
   ```javascript
   { expiresIn: '30m' }  // 30 minutes
   { expiresIn: '2h' }   // 2 hours
   ```

3. **Email Integration Required**: For production, implement actual email sending in forgot-password endpoint.

4. **Environment Variables**: Ensure these are set:
   ```
   JWT_SECRET=your_secret_key
   FRONTEND_URL=http://localhost:4028  # For dev
   NODE_ENV=development  # or production
   ```

5. **Password Requirements**: Current validation:
   - Minimum 8 characters
   - At least 1 uppercase letter
   - Can add more complexity if needed

---

## 🐛 Troubleshooting

### **Issue: "Invalid or expired reset token"**
- Token may have expired (1 hour limit)
- Request a new password reset
- Ensure token hasn't been used before

### **Issue: "This reset link has already been used"**
- The token can only be used once
- Request a new password reset if needed

### **Issue: "Password must contain uppercase letter"**
- Add an uppercase letter (A-Z) to password
- Other requirements: 8+ characters, matching confirmation

### **Issue: Reset link not working**
- Check that token is copied correctly (no extra spaces)
- Verify token hasn't expired
- Try requesting a fresh password reset

### **Issue: Can't see reset link in development**
- Check backend console for logged reset link
- Ensure `NODE_ENV=development` is set
- Reset link format: `/reset-password?token=xxx`

---

## 📚 Related Documentation

- JWT Documentation: https://jwt.io/
- Password Security Best Practices: https://owasp.org/www-community/attacks/Password_Spraying_Attack
- HTTP Security Headers: https://cheatsheetseries.owasp.org/
