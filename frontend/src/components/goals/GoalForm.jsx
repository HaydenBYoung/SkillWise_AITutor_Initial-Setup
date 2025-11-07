import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LoadingSpinner from '../common/LoadingSpinner';

// Goal form validation schema
const goalSchema = z.object({
  title: z
    .string()
    .min(1, 'Goal title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  target_completion_date: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      return !isNaN(Date.parse(date));
    }, 'Invalid date format'),
});

const GoalForm = ({
  onSubmit,
  onCancel,
  initialData = null,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      category: '',
      difficulty_level: 'medium',
      target_completion_date: '',
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      if (!initialData) {
        reset(); // Clear form after successful creation
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const categories = [
    { value: '', label: 'No Category' },
    { value: 'programming', label: 'Programming' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'language', label: 'Language Learning' },
    { value: 'other', label: 'Other' },
  ];

  const difficultyLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="goal-form">
      <div className="form-group">
        <label htmlFor="title">
          Goal Title <span className="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={`form-input ${errors.title ? 'input-error' : ''}`}
          placeholder="e.g., Learn React Development"
          data-testid="goal-title-input"
        />
        {errors.title && (
          <span className="error-text">{errors.title.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          {...register('description')}
          className={`form-input ${errors.description ? 'input-error' : ''}`}
          rows={4}
          placeholder="Describe what you want to achieve with this goal..."
          data-testid="goal-description-input"
        />
        {errors.description && (
          <span className="error-text">{errors.description.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            {...register('category')}
            className={`form-input ${errors.category ? 'input-error' : ''}`}
            data-testid="goal-category-select"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="error-text">{errors.category.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="difficulty_level">Difficulty</label>
          <select
            id="difficulty_level"
            {...register('difficulty_level')}
            className={`form-input ${
              errors.difficulty_level ? 'input-error' : ''
            }`}
          >
            {difficultyLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          {errors.difficulty_level && (
            <span className="error-text">
              {errors.difficulty_level.message}
            </span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="target_completion_date">Target Completion Date</label>
        <input
          id="target_completion_date"
          type="date"
          {...register('target_completion_date')}
          className={`form-input ${
            errors.target_completion_date ? 'input-error' : ''
          }`}
          data-testid="goal-target-date-input"
        />
        {errors.target_completion_date && (
          <span className="error-text">
            {errors.target_completion_date.message}
          </span>
        )}
        <small>Leave blank if you don't have a specific target date</small>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || isLoading}
          data-testid="save-goal-button"
        >
          {isSubmitting || isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : initialData ? (
            'Update Goal'
          ) : (
            'Create Goal'
          )}
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
