import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Schema
const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginForm({ onSubmit }) {
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const submit = async (data) => {
    setFormError(null);

    try {
      const result = await onSubmit(data);

      // If caller returns an object with success:false and fields mapping, map errors
      if (result && result.success === false) {
        const err = result.error || 'Login failed';
        // If result.fields provided, map to field errors
        if (result.fields) {
          Object.entries(result.fields).forEach(([field, msg]) => {
            setError(field, { type: 'server', message: msg });
          });
        }

        // Map common errors
        if (result.type === 'validation') {
          setFormError(err);
        } else if (
          result.type === 'credentials' ||
          result.type === 'conflict'
        ) {
          // show under password/email
          setError('password', { type: 'server', message: err });
        } else {
          setFormError(err);
        }
      }
    } catch (err) {
      // If onSubmit throws, normalize errors
      const message = err?.message || 'Login failed. Please try again.';
      // Network errors
      if (err?.type === 'network') {
        setFormError(
          'Network error. Please check your connection and try again.'
        );
      } else {
        setFormError(message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      {formError && (
        <div role="alert" className="mb-3 p-2 bg-red-50 text-red-800">
          {formError}
        </div>
      )}

      <div className="mb-3">
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="mt-1 w-full border p-2"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-red-600 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="mt-1 w-full border p-2"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-red-600 text-sm">{errors.password.message}</p>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <label className="inline-flex items-center">
          <input type="checkbox" className="mr-2" {...register('remember')} />
          <span className="text-sm">Remember me</span>
        </label>
        <a href="/forgot-password" className="text-sm text-blue-600">
          Forgot?
        </a>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
