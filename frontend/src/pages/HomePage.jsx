import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to SkillWise 🎓</h1>
          <p>Your AI-powered learning companion for skill development</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary" data-cy="get-started-button">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary" data-cy="sign-in-button">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose SkillWise?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🤖 AI-Powered Feedback</h3>
              <p>Get personalized, instant feedback on your work from advanced AI technology</p>
            </div>
            <div className="feature-card">
              <h3>🎯 Goal Tracking</h3>
              <p>Set clear learning goals and track your progress with intuitive dashboards</p>
            </div>
            <div className="feature-card">
              <h3>👥 Peer Reviews</h3>
              <p>Learn collaboratively through constructive peer feedback and discussions</p>
            </div>
            <div className="feature-card">
              <h3>🏆 Achievements</h3>
              <p>Earn badges, climb leaderboards, and celebrate your learning milestones</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;