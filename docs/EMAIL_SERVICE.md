# Email Service Documentation

## Overview
The email service provides automated email notifications for SkillWise users using Gmail SMTP configuration.

## Configuration

### Environment Variables
Add these to your `.env` file:

```bash
SMTP_USER=efowler9@murraystate.edu
SMTP_PASS=jatj zvug ogiw shux  # Gmail app password
FRONTEND_URL=http://localhost:3000  # Used for password reset links
```

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password at https://myaccount.google.com/apppasswords
3. Add credentials to `.env` file

## Email Types

### 1. Welcome Email
**Trigger:** New user registration  
**Implementation:** `authService.register` calls `emailService.sendWelcomeEmail`  
**Content:** Welcome message with getting started information

```javascript
await emailService.sendWelcomeEmail(userEmail, userName);
```

### 2. Password Reset Email
**Trigger:** User requests password reset  
**Implementation:** `authController.forgotPassword` calls `emailService.sendPasswordResetEmail`  
**Content:** Password reset link with 1-hour expiration token

```javascript
await emailService.sendPasswordResetEmail(userEmail, resetToken);
```

**Database:** `password_reset_tokens` table stores tokens with expiration

### 3. Progress Update Email
**Trigger:** Weekly scheduled task  
**Implementation:** `scheduledTasks.sendWeeklyProgressEmails` calls `emailService.sendProgressUpdate`  
**Content:** Weekly summary with points, level, and completed challenges

```javascript
await emailService.sendProgressUpdate(userEmail, {
  totalPoints: 500,
  level: 3,
  completedChallenges: 12
});
```

### 4. Achievement Notification Email
**Trigger:** User earns new achievement  
**Implementation:** `achievementService.awardAchievement` calls `emailService.sendAchievementNotification`  
**Content:** Achievement unlocked message with title, description, and points

```javascript
await emailService.sendAchievementNotification(userEmail, {
  title: 'First Steps',
  description: 'Completed your first challenge',
  points: 10
});
```

## Email + In-App Notification Integration

When an achievement is earned:
1. Record is inserted into `user_achievements` table
2. Email notification is sent via `emailService`
3. In-app notification is created via `notificationService`
4. User sees both email and in-app notification

## Testing

### Unit Tests
Email service methods are unit tested with mocked transporter:

```javascript
// backend/tests/unit/emailService.test.js
const emailService = require('../../src/services/emailService');

beforeEach(() => {
  const mockTransporter = { sendMail: jest.fn() };
  emailService.setTransporter(mockTransporter);
});
```

### Integration Tests
Password reset flow is tested end-to-end:

```javascript
// backend/tests/integration/passwordReset.e2e.test.js
// Tests forgot-password and reset-password endpoints
```

## Migrations

### 017_create_password_reset_tokens.sql
Creates table for storing password reset tokens:
- `token`: unique reset token (32-byte hex string)
- `expires_at`: token expiration timestamp (1 hour from creation)
- `used`: boolean flag to prevent token reuse

### 018_seed_achievements.sql
Seeds achievement data for milestone integration:
- first-steps (1 challenge)
- five-challenges (5 challenges)
- ten-challenges (10 challenges)
- challenge-master (25 challenges)
- challenge-legend (50 challenges)

## API Endpoints

### POST /api/auth/forgot-password
Request password reset email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent"
}
```

### POST /api/auth/reset-password
Reset password using token

**Request:**
```json
{
  "token": "abc123...",
  "password": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

## Scheduled Tasks

### Weekly Progress Emails
Run the scheduled task to send weekly progress emails to all users:

```javascript
const scheduledTasks = require('./src/utils/scheduledTasks');
await scheduledTasks.sendWeeklyProgressEmails();
```

**Recommended:** Set up a cron job or task scheduler to run this weekly:
```bash
# Run every Sunday at 9 AM
0 9 * * 0 cd /path/to/backend && node -e "require('./src/utils/scheduledTasks').sendWeeklyProgressEmails()"
```

## Error Handling

All email methods:
- Log errors to console instead of failing the parent operation
- Allow registration/achievements/password reset to succeed even if email fails
- Return info object with `messageId` on success

Example:
```javascript
try {
  await emailService.sendWelcomeEmail(user.email, user.first_name);
} catch (err) {
  console.error('Failed to send welcome email:', err.message);
  // Don't fail registration
}
```

## Service Integration Summary

| Event | Email Type | In-App Notification | Database Update |
|-------|-----------|-------------------|----------------|
| Registration | Welcome | No | `users` |
| Password Reset Request | Reset Link | No | `password_reset_tokens` |
| Achievement Earned | Achievement | Yes | `user_achievements`, `notifications` |
| Weekly Progress | Progress Update | No | None (read-only) |
| Peer Review Created | None | Yes (reviewee) | `notifications` |

## Troubleshooting

### Email not sending
1. Check SMTP_USER and SMTP_PASS in `.env`
2. Verify Gmail app password is correct (not regular password)
3. Check console logs for specific error messages
4. Test with a simple script: `node -e "require('./src/services/emailService').sendWelcomeEmail('test@test.com', 'Test')"`

### Password reset not working
1. Verify migration 017 has been run: `SELECT * FROM password_reset_tokens LIMIT 1;`
2. Check token expiration (1 hour window)
3. Ensure FRONTEND_URL is set correctly for reset links

### Achievements not triggering emails
1. Verify migration 018 has seeded achievement data
2. Check `achievements` table for matching keys (first-steps, five-challenges, etc.)
3. Ensure user email exists in `users` table
4. Check console logs for achievement awarding errors
