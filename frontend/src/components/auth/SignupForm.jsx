import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePasswordStrength } from '../../hooks/usePasswordStrength';

const SignupForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    control,
  } = useForm();

  const password = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });

  const passwordStrength = usePasswordStrength(password);

  const getStrengthBarClass = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 w-1/5';
      case 'orange':
        return 'bg-orange-500 w-2/5';
      case 'yellow':
        return 'bg-yellow-500 w-3/5';
      case 'blue':
        return 'bg-blue-500 w-4/5';
      case 'green':
        return 'bg-green-500 w-full';
      default:
        return '';
    }
  };

  const getStrengthTextClass = (color) => {
    switch (color) {
      case 'red':
        return 'text-red-600';
      case 'orange':
        return 'text-orange-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      default:
        return '';
    }
  };
  const [serverError, setServerError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const response = await signup({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response?.status === 422) {
        // Handle validation errors
        const details = error.response.data.error.details;
        if (Array.isArray(details)) {
          details.forEach((detail) => {
            setError(detail.field, {
              type: 'server',
              message: detail.message,
            });
          });
        } else {
          setServerError('Validation failed. Please check your input.');
        }
      } else {
        setServerError(
          error.response?.data?.error?.message ||
            'An error occurred during signup'
        );
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto space-y-6"
    >
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {serverError}
        </div>
      )}

      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700"
        >
          <div className="flex items-center">
            <span>Full Name</span>
            <Tooltip message="Enter your real name as it will appear on your profile">
              <span className="ml-1 text-gray-400 hover:text-gray-500 cursor-help">
                ⓘ
              </span>
            </Tooltip>
          </div>
        </label>
        <input
          id="fullName"
          type="text"
          {...register('fullName', {
            required: 'Full name is required',
            minLength: {
              value: 2,
              message: 'Full name must be at least 2 characters',
            },
            maxLength: {
              value: 50,
              message: 'Full name must not exceed 50 characters',
            },
          })}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.fullName ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          <div className="flex items-center">
            <span>Email Address</span>
            <Tooltip message="Use your primary email address. This will be used for account verification and notifications.">
              <span className="ml-1 text-gray-400 hover:text-gray-500 cursor-help">
                ⓘ
              </span>
            </Tooltip>
          </div>
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            pattern: {
              value:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
              message:
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            },
          })}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.password ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        {password && (
          <div className="mt-1">
            <div className="h-2 bg-gray-200 rounded">
              <div
                className={`h-full rounded transition-all duration-300 ${getStrengthBarClass(
                  passwordStrength.color
                )}`}
              />
            </div>
            <p
              className={`mt-1 text-sm ${getStrengthTextClass(
                passwordStrength.color
              )}`}
            >
              {passwordStrength.message}
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignupForm;
