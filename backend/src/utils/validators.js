// TODO: Data validation utility functions
const { z } = require('zod');

// TODO: Email validation
const validateEmail = (email) => {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
};

// TODO: Password validation
const validatePassword = (password) => {
  const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

  const result = passwordSchema.safeParse(password);
  return {
    isValid: result.success,
    errors: result.success ? [] : result.error.errors.map(e => e.message),
  };
};

// TODO: Username validation
const validateUsername = (username) => {
  const usernameSchema = z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

  return usernameSchema.safeParse(username).success;
};

// TODO: Phone number validation
const validatePhoneNumber = (phone) => {
  const phoneSchema = z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format');

  return phoneSchema.safeParse(phone).success;
};

// TODO: URL validation
const validateUrl = (url) => {
  const urlSchema = z.string().url();
  return urlSchema.safeParse(url).success;
};

// TODO: Date validation
const validateDate = (date) => {
  const dateSchema = z.string().datetime();
  return dateSchema.safeParse(date).success;
};

// TODO: MongoDB ObjectId validation
const validateObjectId = (id) => {
  const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
  return objectIdSchema.safeParse(id).success;
};

// TODO: Sanitize input to prevent XSS
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// TODO: Validate file upload
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'],
  } = options;

  const errors = [];

  if (file.size > maxSize) {
    errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }

  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed`);
  }

  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(ext)) {
    errors.push(`File extension ${ext} not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Goal validation
const validateGoalData = (goalData, isPartial = false) => {
  const errors = [];
  const { title, description, category, difficulty_level, target_completion_date } = goalData;

  // Title validation (required for new goals)
  if (!isPartial && (!title || title.trim().length === 0)) {
    errors.push('Title is required');
  } else if (title && (title.length < 3 || title.length > 255)) {
    errors.push('Title must be between 3 and 255 characters');
  }

  // Description validation (optional but has limits)
  if (description && description.length > 2000) {
    errors.push('Description cannot exceed 2000 characters');
  }

  // Category validation (optional but has limits)
  if (category && category.length > 100) {
    errors.push('Category cannot exceed 100 characters');
  }

  // Difficulty level validation
  if (difficulty_level && !['easy', 'medium', 'hard', 'expert'].includes(difficulty_level)) {
    errors.push('Difficulty level must be one of: easy, medium, hard, expert');
  }

  // Target completion date validation
  if (target_completion_date) {
    const targetDate = new Date(target_completion_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(targetDate.getTime())) {
      errors.push('Invalid target completion date');
    } else if (targetDate < today) {
      errors.push('Target completion date cannot be in the past');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Challenge validation
const validateChallengeData = (challengeData, isPartial = false) => {
  const errors = [];
  const { title, description, difficulty_level, estimated_time_minutes, category } = challengeData;

  // Title validation (required for new challenges)
  if (!isPartial && (!title || title.trim().length === 0)) {
    errors.push('Title is required');
  } else if (title && (title.length < 3 || title.length > 255)) {
    errors.push('Title must be between 3 and 255 characters');
  }

  // Description validation (required for new challenges)
  if (!isPartial && (!description || description.trim().length === 0)) {
    errors.push('Description is required');
  } else if (description && description.length > 2000) {
    errors.push('Description cannot exceed 2000 characters');
  }

  // Category validation (required for new challenges)
  if (!isPartial && (!category || category.trim().length === 0)) {
    errors.push('Category is required');
  } else if (category && category.length > 100) {
    errors.push('Category cannot exceed 100 characters');
  }

  // Difficulty level validation
  if (difficulty_level && !['easy', 'medium', 'hard', 'expert'].includes(difficulty_level)) {
    errors.push('Difficulty level must be one of: easy, medium, hard, expert');
  }

  // Estimated time validation
  if (estimated_time_minutes !== undefined) {
    if (!Number.isInteger(estimated_time_minutes) || estimated_time_minutes < 1 || estimated_time_minutes > 1440) {
      errors.push('Estimated time must be a whole number between 1 and 1440 minutes');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhoneNumber,
  validateUrl,
  validateDate,
  validateObjectId,
  validateGoalData,
  validateChallengeData,
  sanitizeString,
  validateFileUpload,
};
