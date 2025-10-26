import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const LoginForm = ({ onSubmit: parentOnSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm();
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const response = await login({
        email: data.email,
        password: data.password,
        remember: data.remember,
      });

      if (response.success) {
        if (parentOnSubmit) {
          parentOnSubmit(data);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setServerError('Invalid email or password');
      } else if (error.response?.status === 422) {
        const details = error.response.data.error.details;
        if (Array.isArray(details)) {
          details.forEach((detail) => {
            setError(detail.field, {
              type: 'server',
              message: detail.message,
            });
          });
        }
      } else {
        setServerError(
          error.response?.data?.error?.message ||
            'An error occurred during login'
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{serverError}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          <div className="flex items-center">
            <span>Email Address</span>
            <Tooltip message="Enter the email address you used to sign up">
              <span className="ml-1 text-gray-400 hover:text-gray-500 cursor-help">
                ⓘ
              </span>
            </Tooltip>
          </div>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          } focus:border-blue-500 focus:ring-blue-500`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            <div className="flex items-center">
              <span>Password</span>
              <Tooltip message="Enter your account password">
                <span className="ml-1 text-gray-400 hover:text-gray-500 cursor-help">
                  ⓘ
                </span>
              </Tooltip>
            </div>
          </label>
          <a
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot password?
          </a>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password', {
            required: 'Password is required',
          })}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.password ? 'border-red-300' : 'border-gray-300'
          } focus:border-blue-500 focus:ring-blue-500`}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="remember"
          type="checkbox"
          {...register('remember')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
};

export default LoginForm;
