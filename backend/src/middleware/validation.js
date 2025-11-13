// TODO: Request validation middleware using Zod schemas
const { z } = require('zod');
const { AppError } = require('./errorHandler');

// TODO: Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'password too short')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'password must contain lowercase, uppercase, and number'),
  confirmPassword: z.string()
    .min(1, 'confirm password is required'),
  firstName: z.string().min(1, 'first name is required').max(50, 'first name too long'),
  lastName: z.string().min(1, 'last name is required').max(50, 'last name too long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwords don\'t match',
  path: ['confirmPassword'],
});

const goalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Goal title is required').max(255, 'Title too long'),
    description: z.string().optional(),
    category: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    targetCompletionDate: z.string().datetime().optional(),
  }),
});

const challengeSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Challenge title is required').max(255, 'Title too long'),
    description: z.string().min(1, 'Description is required'),
    instructions: z.string().min(1, 'Instructions are required'),
    category: z.string().min(1, 'Category is required'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    estimatedTimeMinutes: z.number().int().positive().optional(),
    pointsReward: z.number().int().positive().default(10),
    maxAttempts: z.number().int().positive().default(3),
  }),
});

// TODO: Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        // Format validation error response with all error details
        const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
        error.errors = errors;
        error.message = errors.map(e => e.message).join('; ');
        return next(error);
      }

      // Attach validated data to request
      req.validated = result.data;
      next();
    } catch (error) {
      next(new AppError('Validation error', 400, 'VALIDATION_ERROR'));
    }
  };
};

// TODO: Specific validation middleware functions
const loginValidation = validate(loginSchema);
const registerValidation = validate(registerSchema);
const goalValidation = validate(goalSchema);
const challengeValidation = validate(challengeSchema);

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  goalValidation,
  challengeValidation,
  // Export schemas for testing
  schemas: {
    loginSchema,
    registerSchema,
    goalSchema,
    challengeSchema,
  },
};
