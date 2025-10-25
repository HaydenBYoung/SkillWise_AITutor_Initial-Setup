import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signup as signupRequest } from '../services/authService';

// Validation schema
const passwordRegex = /(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])/;
const SignupSchema = z
  .object({
    name: z.string().min(2, 'Please enter your name'),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRegex, 'Password must include upper, lower and a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agree: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function SignupForm() {
  const [status, setStatus] = useState({
    loading: false,
    message: null,
    error: null,
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(SignupSchema) });

  const onSubmit = async (values) => {
    setStatus({ loading: true, message: null, error: null });
    // pick only the fields the backend expects
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
    };

    try {
      const res = await signupRequest(payload);
      setStatus({
        loading: false,
        message:
          res.message || 'Signup successful. Check your email to verify.',
        error: null,
      });
    } catch (err) {
      setStatus({
        loading: false,
        message: null,
        error: err.message || 'Signup failed',
      });

      // Map server field errors to form fields where possible
      if (err.type === 'validation' && err.fields) {
        Object.entries(err.fields).forEach(([field, msg]) => {
          try {
            setError(field, { type: 'server', message: msg });
          } catch (e) {
            // ignore
          }
        });
      }

      // Handle conflict (e.g., email already exists)
      if (err.type === 'conflict') {
        setError('email', {
          type: 'server',
          message: err.message || 'Email already in use',
        });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow-sm bg-white">
      <h2 className="text-2xl font-semibold mb-4">Create an account</h2>

      {status.message && (
        <div className="mb-4 p-3 bg-green-50 text-green-800">
          {status.message}
        </div>
      )}
      {status.error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800">{status.error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="block text-sm font-medium">Full name</label>
          <input className="mt-1 w-full border p-2" {...register('name')} />
          {errors.name && (
            <p className="text-red-600 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full border p-2"
            type="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-red-600 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium">Password</label>
          <input
            className="mt-1 w-full border p-2"
            type="password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-red-600 text-sm">{errors.password.message}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium">Confirm password</label>
          <input
            className="mt-1 w-full border p-2"
            type="password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input type="checkbox" className="mr-2" {...register('agree')} />
            <span className="text-sm">
              I agree to the Terms and Privacy Policy
            </span>
          </label>
          {errors.agree && (
            <p className="text-red-600 text-sm">{errors.agree.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || status.loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-60"
          >
            {isSubmitting || status.loading ? 'Signing up...' : 'Sign up'}
          </button>
        </div>
      </form>
    </div>
  );
}
