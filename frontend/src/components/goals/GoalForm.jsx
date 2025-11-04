import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const GoalForm = ({ goal = null, onSubmit, onCancel, isLoading = false }) => {
  const isEditing = !!goal;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: goal || {
      title: '',
      description: '',
      category: '',
      difficulty_level: 'medium',
      target_completion_date: '',
    },
  });

  const categories = [
    'Programming',
    'Web Development',
    'Data Science',
    'Design',
    'Business',
    'Marketing',
    'Language Learning',
    'Other',
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' },
  ];

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="goal-form">
      <div className="form-header">
        <h3>{isEditing ? 'Edit Goal' : 'Create New Goal'}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Goal Title *
          </label>
          <input
            type="text"
            id="title"
            {...register('title', {
              required: 'Title is required',
              minLength: {
                value: 3,
                message: 'Title must be at least 3 characters',
              },
              maxLength: {
                value: 255,
                message: 'Title cannot exceed 255 characters',
              },
            })}
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="e.g., Learn React.js fundamentals"
            disabled={isLoading}
          />
          {errors.title && (
            <span className="form-error">{errors.title.message}</span>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description', {
              maxLength: {
                value: 2000,
                message: 'Description cannot exceed 2000 characters',
              },
            })}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder="Describe what you want to achieve with this goal..."
            disabled={isLoading}
          />
          {errors.description && (
            <span className="form-error">{errors.description.message}</span>
          )}
        </div>

        {/* Category and Difficulty Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category *
            </label>
            <select
              id="category"
              {...register('category', {
                required: 'Category is required',
              })}
              className={`form-select ${errors.category ? 'error' : ''}`}
              disabled={isLoading}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="form-error">{errors.category.message}</span>
            )}
          </div>

          {/* Difficulty Level */}
          <div className="form-group">
            <label htmlFor="difficulty_level" className="form-label">
              Difficulty Level
            </label>
            <select
              id="difficulty_level"
              {...register('difficulty_level')}
              className="form-select"
              disabled={isLoading}
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Completion Date */}
        <div className="form-group">
          <label htmlFor="target_completion_date" className="form-label">
            Target Completion Date
          </label>
          <input
            type="date"
            id="target_completion_date"
            {...register('target_completion_date', {
              validate: (value) => {
                if (!value) return true; // Optional field
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selectedDate >= today || 'Target date cannot be in the past';
              },
            })}
            className={`form-input ${errors.target_completion_date ? 'error' : ''}`}
            min={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
          {errors.target_completion_date && (
            <span className="form-error">{errors.target_completion_date.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEditing ? 'Update Goal' : 'Create Goal'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;