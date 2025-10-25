import {} from 'react';
import {} from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-semibold text-slate-800">
            SkillWise
          </Link>
          <nav className="hidden md:flex gap-2 text-sm text-slate-600">
            <Link
              to="/dashboard"
              className="px-3 py-2 hover:bg-slate-50 rounded"
            >
              Dashboard
            </Link>
            <Link to="/goals" className="px-3 py-2 hover:bg-slate-50 rounded">
              Goals
            </Link>
            <Link
              to="/challenges"
              className="px-3 py-2 hover:bg-slate-50 rounded"
            >
              Challenges
            </Link>
            <Link
              to="/progress"
              className="px-3 py-2 hover:bg-slate-50 rounded"
            >
              Progress
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-700 hidden sm:inline">
                {user.first_name || user.email}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="text-sm text-slate-700 hover:underline"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm text-slate-700 hover:underline"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
