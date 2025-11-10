// TODO: Implement dashboard overview component
import React, { useEffect, useState } from 'react';
// Use plain anchors here so component renders in tests without requiring a Router context

const DashboardOverview = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const goal = e.detail?.goal;
      setNotification({
        message: `New goal created: ${goal?.title || 'Untitled'}`,
      });

      // Hide after 4 seconds
      setTimeout(() => setNotification(null), 4000);
    };

    window.addEventListener('goal:created', handler);
    return () => window.removeEventListener('goal:created', handler);
  }, []);

  return (
    <div className="space-y-6">
      {notification && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
          {notification.message}
        </div>
      )}

      {/* Statistics Grid (three columns horizontally) */}
      <div className="grid grid-cols-3 gap-5 items-stretch">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-indigo-500 rounded-md p-1">
                  <svg
                    className="text-white"
                    style={{ width: '32px', height: '32px' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Goals Completed
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">0</div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <a
              href="/goals"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate"
            >
              View all goals
            </a>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 rounded-md p-1">
                  <svg
                    className="text-white"
                    style={{ width: '32px', height: '32px' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Challenges Completed
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">0</div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <a
              href="/challenges"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate"
            >
              View challenges
            </a>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-500 rounded-md p-1">
                  <svg
                    className="text-white"
                    style={{ width: '32px', height: '32px' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Current Streak
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    0 days
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <a
              href="/progress"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate"
            >
              View progress
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-5 py-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h2>
          <div className="mt-5">
            <div className="flow-root">
              <p className="text-gray-500">No recent activity to show</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-5 py-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="/goals/new"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create New Goal
            </a>
            <a
              href="/challenges"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Start a Challenge
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
