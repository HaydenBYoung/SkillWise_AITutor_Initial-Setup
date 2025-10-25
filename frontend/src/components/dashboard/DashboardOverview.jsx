// TODO: Implement dashboard overview component
import {} from 'react';

const DashboardOverview = () => {
  // TODO: Add progress overview, recent activity, quick actions, statistics
  return (
    <div className="dashboard-overview max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Welcome to SkillWise</h1>
        <p className="text-sm text-slate-600">
          Overview of your goals and challenges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow-sm">
          <h3 className="text-sm font-medium text-slate-700">
            Goals Completed
          </h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-white rounded shadow-sm">
          <h3 className="text-sm font-medium text-slate-700">
            Challenges Completed
          </h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-white rounded shadow-sm">
          <h3 className="text-sm font-medium text-slate-700">Current Streak</h3>
          <p className="text-2xl font-bold">0 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="col-span-2 bg-white rounded shadow-sm p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Goals</h2>
            <div className="text-sm text-slate-500">
              You have 0 active goals
            </div>
          </header>

          <div className="space-y-3">
            {/* Placeholder goal cards */}
            <div className="p-3 border border-slate-100 rounded">
              <h3 className="font-medium">No goals yet</h3>
              <p className="text-sm text-slate-500">
                Create a goal to get started.
              </p>
            </div>
          </div>
        </section>

        <aside className="col-span-1 bg-white rounded shadow-sm p-4">
          <header className="mb-3">
            <h2 className="text-lg font-semibold">Challenges</h2>
            <div className="text-sm text-slate-500">0 active challenges</div>
          </header>

          <div className="space-y-3">
            {/* Placeholder challenge cards */}
            <div className="p-3 border border-slate-100 rounded">
              <h3 className="font-medium">No challenges yet</h3>
              <p className="text-sm text-slate-500">
                Browse challenges to begin learning.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardOverview;
