// Login page with form handling and post-login flow
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; //Link

import { useAuth } from '../hooks/useAuth';

import LoginForm from '../components/auth/LoginForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfettiCelebration from '../components/common/ConfettiCelebration';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page after login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (formData) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        setShowConfetti(true);
        // Navigate after a short delay to show the celebration
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      } else {
        // Provide more helpful error message
        let errorMsg = result.error || 'Login failed. Please try again.';
        if (errorMsg.includes('Invalid credentials')) {
          errorMsg = 'Invalid email or password. Please check your credentials and try again.';
        }
        setError(errorMsg);
      }
    } catch (err) {
      // Provide more helpful error message
      let errorMsg = err.message || 'Login failed. Please try again.';
      if (errorMsg.includes('Invalid credentials') || errorMsg.includes('401')) {
        errorMsg = 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <h1>SkillWise</h1>
            </Link>
            <h2>Welcome Back</h2>
            <p>Sign in to continue your learning journey</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner message="Signing you in..." />
          ) : (
            <LoginForm onSubmit={handleLogin} />
          )}

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Sign up here
              </Link>
            </p>

            <p>
              <Link to="/forgot-password" className="auth-link">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-background">
          <div className="auth-testimonial">
            <blockquote>
              "SkillWise transformed how I learn. The AI feedback is incredibly
              helpful!"
            </blockquote>
            <cite>— Sarah K., Software Developer</cite>
          </div>
        </div>
      </div>

      {showConfetti && (
        <ConfettiCelebration onComplete={() => setShowConfetti(false)} />
      )}
    </div>
  );
};

export default LoginPage;
