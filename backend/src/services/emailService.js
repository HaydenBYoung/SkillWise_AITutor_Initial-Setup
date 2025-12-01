const nodemailer = require('nodemailer');

// Lazy-instantiated transporter to avoid errors when SMTP not configured
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS required for email service');
  }
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return _transporter;
}

// For testing: allow injecting a fake transporter
function setTransporter(t) {
  _transporter = t;
}

function resetTransporter() {
  _transporter = null;
}

const emailService = {
  sendWelcomeEmail: async (userEmail, userName) => {
    if (!userEmail) throw new Error('User email required');
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userEmail,
        subject: 'Welcome to SkillWise!',
        html: `<h1>Welcome ${userName || 'Student'}!</h1><p>We're excited to have you on board. Start your learning journey today!</p>`,
      });
      return info;
    } catch (err) {
      console.error('Failed to send welcome email:', err.message);
      throw err;
    }
  },

  sendPasswordResetEmail: async (userEmail, resetToken) => {
    if (!userEmail || !resetToken) throw new Error('Email and reset token required');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userEmail,
        subject: 'Password Reset Request',
        html: `<h1>Password Reset</h1><p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a><p>This link expires in 1 hour.</p>`,
      });
      return info;
    } catch (err) {
      console.error('Failed to send password reset email:', err.message);
      throw err;
    }
  },

  sendProgressUpdate: async (userEmail, progressData) => {
    if (!userEmail) throw new Error('User email required');
    const { totalPoints, level, completedChallenges } = progressData || {};
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userEmail,
        subject: 'Your Weekly Progress Update',
        html: `<h1>Weekly Progress</h1><p>Total Points: ${totalPoints || 0}</p><p>Level: ${level || 1}</p><p>Completed Challenges: ${completedChallenges || 0}</p><p>Keep up the great work!</p>`,
      });
      return info;
    } catch (err) {
      console.error('Failed to send progress update:', err.message);
      throw err;
    }
  },

  sendAchievementNotification: async (userEmail, achievement) => {
    if (!userEmail) throw new Error('User email required');
    const { title, description, points } = achievement || {};
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userEmail,
        subject: `Achievement Unlocked: ${title || 'New Achievement'}`,
        html: `<h1>🎉 Achievement Unlocked!</h1><h2>${title || 'New Achievement'}</h2><p>${description || ''}</p><p>Points earned: ${points || 0}</p>`,
      });
      return info;
    } catch (err) {
      console.error('Failed to send achievement notification:', err.message);
      throw err;
    }
  },
};

module.exports = emailService;
module.exports.setTransporter = setTransporter;
module.exports.resetTransporter = resetTransporter;
