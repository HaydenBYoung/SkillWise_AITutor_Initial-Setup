import { useForm } from 'react-hook-form';
import { apiService } from '../../services/api';
//import { useAuth } from '../../context/AuthContext';

const GoalForm = ({ defaultValues, onSubmitSuccess, onCancel }) => {
  //const { currentUser } = useAuth(); // to access logged-in user's ID

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultValues || {
      title: '',
      description: '',
      target_date: '',
      type: '',
      difficulty_level: 'medium',
    },
  });

  const onSubmit = async (formData) => {
    try {
      // add user_id from auth context
      const goalData = {
        ...formData,
        //user_id: currentUser?.id || 1, // fallback for testing
      };

      const savedGoal = defaultValues?.id
        ? await apiService.goals.update(defaultValues.id, goalData)
        : await apiService.goals.create(goalData);

      onSubmitSuccess(savedGoal);
    } catch (err) {
      console.error('Error saving goal:', err);
    }
  };

  return (
    <div className="goal-form" data-testid="goal-form">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Title</label>
        <input
          id="title"
          data-testid="goal-title-input"
          {...register('title', { required: 'Title is required' })}
          placeholder="Enter goal title"
        />
        {errors.title && <p className="error">{errors.title.message}</p>}

        <label>Description</label>
        <textarea
          id="description"
          data-testid="goal-description-input"
          {...register('description')}
          placeholder="Enter goal description"
        />

        <label>Target Date</label>
        <input type="date" id="target_date" {...register('target_date')} />

        <label>Goal Type</label>
        <select id="type" {...register('type')}>
          <option value="">Select type</option>
          <option value="personal">Personal</option>
          <option value="career">Career</option>
          <option value="education">Education</option>
        </select>

        <label>Difficulty Level</label>
        <select id="difficulty_level" {...register('difficulty_level')}>
          <option value="easy">Easy (20 points to complete)</option>
          <option value="medium">Medium (50 points to complete)</option>
          <option value="hard">Hard (80 points to complete)</option>
        </select>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            data-testid="goal-submit-button"
          >
            {defaultValues?.id ? 'Update Goal' : 'Create Goal'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            data-testid="goal-cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;
