import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { goalService } from '../../services/goalService';

const ChallengeForm = ({ challenge, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      title: challenge?.title || '',
      description: challenge?.description || '',
      category: challenge?.category || '',
      difficulty_level: challenge?.difficulty_level || 'medium',
      points_value: challenge?.points_value || 10,
      estimated_time_minutes: challenge?.estimated_time_minutes || 30,
      is_public: challenge?.is_public !== undefined ? challenge.is_public : true,
      goal_id: challenge?.goal_id || '',
      requirements: challenge?.requirements || '',
      solution_approach: challenge?.solution_approach || '',
      starter_code: challenge?.starter_code || '',
      test_cases: challenge?.test_cases || '',
    },
  });

  // Load goals for selection
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const response = await goalService.getUserGoals();
        setGoals(response.data);
      } catch (err) {
        console.error('Error loading goals:', err);
      }
    };
    loadGoals();
  }, []);

  // Reset form when challenge changes
  useEffect(() => {
    if (challenge) {
      reset({
        title: challenge.title || '',
        description: challenge.description || '',
        category: challenge.category || '',
        difficulty_level: challenge.difficulty_level || 'medium',
        points_value: challenge.points_value || 10,
        estimated_time_minutes: challenge.estimated_time_minutes || 30,
        is_public: challenge.is_public !== undefined ? challenge.is_public : true,
        goal_id: challenge.goal_id || '',
        requirements: challenge.requirements || '',
        solution_approach: challenge.solution_approach || '',
        starter_code: challenge.starter_code || '',
        test_cases: challenge.test_cases || '',
      });
    }
  }, [challenge, reset]);

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      // Convert string values to appropriate types
      const formattedData = {
        ...data,
        points_value: parseInt(data.points_value, 10),
        estimated_time_minutes: parseInt(data.estimated_time_minutes, 10),
        goal_id: data.goal_id || null,
      };

      await onSubmit(formattedData);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Failed to save challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const difficultyLevels = [
    { value: 'easy', label: 'Easy', description: 'Beginner-friendly, basic concepts' },
    { value: 'medium', label: 'Medium', description: 'Intermediate level, some experience required' },
    { value: 'hard', label: 'Hard', description: 'Advanced level, significant experience needed' },
    { value: 'expert', label: 'Expert', description: 'Expert level, deep knowledge required' },
  ];

  const categories = [
    'programming',
    'web development',
    'data science',
    'algorithms',
    'database',
    'system design',
    'mobile development',
    'devops',
    'machine learning',
    'cybersecurity',
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Challenge Title *
          </label>
          <input
            type="text"
            id="title"
            {...register('title', {
              required: 'Title is required',
              minLength: { value: 3, message: 'Title must be at least 3 characters' },
              maxLength: { value: 255, message: 'Title must be less than 255 characters' },
            })}
            className={`input-field ${errors.title ? 'border-red-300' : ''}`}
            placeholder="Enter challenge title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description', {
              required: 'Description is required',
              minLength: { value: 10, message: 'Description must be at least 10 characters' },
            })}
            className={`input-field ${errors.description ? 'border-red-300' : ''}`}
            placeholder="Describe what this challenge involves..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
              className={`input-field ${errors.category ? 'border-red-300' : ''}`}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
              Difficulty Level *
            </label>
            <select
              id="difficulty_level"
              {...register('difficulty_level', { required: 'Difficulty level is required' })}
              className={`input-field ${errors.difficulty_level ? 'border-red-300' : ''}`}
            >
              {difficultyLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.difficulty_level && <p className="text-red-500 text-sm mt-1">{errors.difficulty_level.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="points_value" className="block text-sm font-medium text-gray-700">
              Points Value *
            </label>
            <input
              type="number"
              id="points_value"
              min="1"
              max="1000"
              {...register('points_value', {
                required: 'Points value is required',
                min: { value: 1, message: 'Points must be at least 1' },
                max: { value: 1000, message: 'Points must be less than 1000' },
              })}
              className={`input-field ${errors.points_value ? 'border-red-300' : ''}`}
            />
            {errors.points_value && <p className="text-red-500 text-sm mt-1">{errors.points_value.message}</p>}
          </div>

          <div>
            <label htmlFor="estimated_time_minutes" className="block text-sm font-medium text-gray-700">
              Estimated Time (minutes) *
            </label>
            <input
              type="number"
              id="estimated_time_minutes"
              min="5"
              max="480"
              {...register('estimated_time_minutes', {
                required: 'Estimated time is required',
                min: { value: 5, message: 'Minimum time is 5 minutes' },
                max: { value: 480, message: 'Maximum time is 8 hours' },
              })}
              className={`input-field ${errors.estimated_time_minutes ? 'border-red-300' : ''}`}
            />
            {errors.estimated_time_minutes && <p className="text-red-500 text-sm mt-1">{errors.estimated_time_minutes.message}</p>}
          </div>

          <div>
            <label htmlFor="goal_id" className="block text-sm font-medium text-gray-700">
              Associated Goal
            </label>
            <select
              id="goal_id"
              {...register('goal_id')}
              className="input-field"
            >
              <option value="">No specific goal</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_public"
            {...register('is_public')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
            Make this challenge public (visible to other users)
          </label>
        </div>
      </div>

      {/* Challenge Content */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Challenge Content</h3>
        
        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
            Requirements
          </label>
          <textarea
            id="requirements"
            rows={4}
            {...register('requirements')}
            className="input-field"
            placeholder="Detailed requirements and specifications for the challenge..."
          />
        </div>

        <div>
          <label htmlFor="solution_approach" className="block text-sm font-medium text-gray-700">
            Solution Approach (Optional)
          </label>
          <textarea
            id="solution_approach"
            rows={3}
            {...register('solution_approach')}
            className="input-field"
            placeholder="High-level approach or hints for solving this challenge..."
          />
        </div>

        <div>
          <label htmlFor="starter_code" className="block text-sm font-medium text-gray-700">
            Starter Code (Optional)
          </label>
          <textarea
            id="starter_code"
            rows={6}
            {...register('starter_code')}
            className="input-field font-mono"
            placeholder="// Starter code template for participants
function sampleFunction() {
  // Your code here
}"
          />
        </div>

        <div>
          <label htmlFor="test_cases" className="block text-sm font-medium text-gray-700">
            Test Cases (Optional)
          </label>
          <textarea
            id="test_cases"
            rows={4}
            {...register('test_cases')}
            className="input-field font-mono"
            placeholder="Input: [1, 2, 3]
Expected Output: [2, 4, 6]

Input: []
Expected Output: []"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : challenge ? 'Update Challenge' : 'Create Challenge'}
        </button>
      </div>
    </form>
  );
};

export default ChallengeForm;