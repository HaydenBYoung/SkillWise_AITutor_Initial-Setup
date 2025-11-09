import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiService } from '../../services/api';

const GoalForm = ({ onCreate }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data) => {
    setErrorMessage('');
    try {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category || 'General',
        difficulty: data.difficulty || 'Medium',
        targetDate: data.targetDate || null,
      };

      const response = await apiService.goals.create(payload);

      const created = response.data?.goal || response.data;

      if (onCreate) onCreate(created);

      // dispatch global event so Dashboard can show notification
      window.dispatchEvent(new CustomEvent('goal:created', { detail: { goal: created } }));

      reset();
    } catch (err) {
      console.error('Goal creation failed', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create goal');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Goal</h2>

      {errorMessage && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 p-2 rounded">{errorMessage}</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            {...register('title', { required: 'Title is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Ex: Learn React Hooks"
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            rows={4}
            placeholder="Describe your goal..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              {...register('category')}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="e.g. Frontend"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
            <select
              {...register('difficulty')}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              defaultValue="Medium"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Target Date</label>
          <input
            type="date"
            {...register('targetDate')}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700"
            disabled={isSubmitting}
          >
            Reset
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Goal'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default GoalForm;
