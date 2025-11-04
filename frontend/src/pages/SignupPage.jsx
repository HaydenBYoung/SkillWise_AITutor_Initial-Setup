import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfettiCelebration from '../components/common/ConfettiCelebration';

// Signup form validation schema
const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});

const SignupPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (formData) => {
    console.log('Form submitted with data:', formData);
    console.log('Validation errors:', errors);
    try {
      setIsLoading(true);
      setError('');

      const result = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) {
        // Show celebration!
        setShowConfetti(true);

        // Wait a moment for confetti, then navigate
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <h1>SkillWise</h1>
            </Link>
            <h2>Create Your Account</h2>
            <p>Start your personalized learning journey today</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner message="Creating your account..." />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="signup-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    {...register('firstName')}
                    className={errors.firstName ? 'input-error' : ''}
                  />
                  {errors.firstName && (
                    <span className="error-text">{errors.firstName.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    {...register('lastName')}
                    className={errors.lastName ? 'input-error' : ''}
                  />
                  {errors.lastName && (
                    <span className="error-text">{errors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && (
                  <span className="error-text">{errors.email.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  {...register('password')}
                  className={errors.password ? 'input-error' : ''}
                />
                {errors.password && (
                  <span className="error-text">{errors.password.message}</span>
                )}
                <small>Must be at least 8 characters with uppercase, lowercase, and number</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-background">
          <div className="auth-features">
            <h3>What you'll get:</h3>
            <ul>
              <li>✅ Personalized learning paths</li>
              <li>✅ AI-powered feedback</li>
              <li>✅ Progress tracking</li>
              <li>✅ Peer learning community</li>
              <li>✅ Achievement system</li>
            </ul>
          </div>
        </div>
      </div>

      {showConfetti && (
        <ConfettiCelebration onComplete={() => setShowConfetti(false)} />
      )}
    </div>
  );
};

export default SignupPage;
