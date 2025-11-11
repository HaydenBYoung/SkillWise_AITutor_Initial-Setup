// Goals management page (creation and basic client-side filtering implemented)
import { useEffect, useState } from 'react';
import GoalCard from '../components/goals/GoalCard';
import DashboardLayout from '../components/common/DashboardLayout';
import GoalForm from '../components/goals/GoalForm';
import { apiService } from '../services/api'; //might be written wrong

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await apiService.goals.getAll();
        // API returns an envelope { success: true, data: [...] }
        // ensure we set the inner array (or empty array fallback)
        setGoals(data && data.data ? data.data : []);
      } catch (error) {
        console.error('Failed to fetch goals:', error);
      }
    };
    fetchGoals();
  }, []);

  //Button handlers
  const handleCreate = () => {
    setEditGoal(null);
    setShowForm(true);
  };

  const handleEdit = (goal) => {
    setEditGoal(goal);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await apiService.goals.delete(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleFormSubmit = (savedGoal) => {
    console.log('Saved goal from API:', savedGoal);
    console.log('Current goals:', goals);

    if (editGoal) {
      // savedGoal may be an API envelope { success, data }
      const updated = savedGoal && savedGoal.data ? savedGoal.data : savedGoal;
      setGoals((prev) =>
        Array.isArray(prev)
          ? prev.map((g) => (g.id === updated.id ? updated : g))
          : [updated],
      );
    } else {
      const created = savedGoal && savedGoal.data ? savedGoal.data : savedGoal;
      setGoals((prev) =>
        Array.isArray(prev) ? [...prev, created] : [created],
      );
    }
    setShowForm(false);
  };

  //Mark chall/goal complete
  const handleChallengeCompletion = async (id) => {
    try {
      const updatedResp = await apiService.goals.update(id, {
        status: 'completed',
      });
      const updatedGoal =
        updatedResp && updatedResp.data ? updatedResp.data : updatedResp;
      setGoals((prevGoals) =>
        Array.isArray(prevGoals)
          ? prevGoals.map((goal) => (goal.id === id ? updatedGoal : goal))
          : [updatedGoal],
      );

      // Optionally, update progress tracking too:
      if (apiService.progress?.updateOverview) {
        await apiService.progress.updateOverview();
      }

      console.log(`Goal ${id} marked as completed.`);
    } catch (error) {
      console.error('Failed to mark goal as complete:', error);
    }
  };

  // TODO: Enhance sorting and add server-side filtering/search (creation and basic client-side filters are implemented)
  return (
    <DashboardLayout>
      <div className="goals-page">
        <div className="page-header">
          <h1>My Learning Goals</h1>
          <button onClick={handleCreate} className="btn-primary">
            Create New Goal
          </button>
        </div>

        <div className="goals-filters">
          {/* Consider adding status/difficulty filters and server-side filtering for large datasets */}
          <select>
            <option value="">All Categories</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>
        </div>

        {showForm && (
          <GoalForm
            defaultValues={editGoal}
            onSubmitSuccess={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="goals-grid">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEdit(goal)}
                onDelete={() => handleDelete(goal.id)}
                onComplete={handleChallengeCompletion}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>No goals yet. Create your first learning goal!</p>
            </div>
          )}
        </div>
      </div>
      {/*below is for cypress testing*/}
      <button
        data-testid="create-goal-button"
        onClick={handleCreate}
        className="btn-primary"
      >
        Create New Goal
      </button>
      {/*above is for cypress testing*/}
    </DashboardLayout>
  );
};

export default GoalsPage;
