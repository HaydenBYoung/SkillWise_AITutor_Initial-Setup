import {} from 'react';
import {} from 'react-router-dom';
import {} from './contexts/AuthContext';
import {} from './components/ProtectedRoute';
import {} from './components/layout/Navbar';

// Import all pages
import {} from './pages/HomePage';
import {} from './pages/LoginPage';
import {} from './pages/SignupPage';
import {} from './pages/DashboardPage';
import {} from './pages/GoalsPage';
import {} from './pages/ChallengesPage';
import {} from './pages/ProgressPage';
import {} from './pages/LeaderboardPage';
import {} from './pages/PeerReviewPage';
import {} from './pages/ProfilePage';
import {} from './pages/NotFoundPage';
import {} from './pages/ErrorPage';

// Import layout components (TODO: Create these)
// import Navbar from './components/layout/Navbar';
// import Footer from './components/layout/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />

          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/error" element={<ErrorPage />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <GoalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/challenges"
                element={
                  <ProtectedRoute>
                    <ChallengesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <ProgressPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/peer-review"
                element={
                  <ProtectedRoute>
                    <PeerReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* TODO: Add Footer component */}
          {/* <Footer /> */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
