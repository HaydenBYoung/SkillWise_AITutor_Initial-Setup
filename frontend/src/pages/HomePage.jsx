import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page">
      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .dark-mode .home-page {
          background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
        }
        
        .hero {
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          color: white;
        }
        
        .hero-content h1 {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .hero-content p {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          color: rgba(255,255,255,0.9);
        }
        
        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .hero-actions .btn {
          padding: 1rem 2rem;
          font-size: 1.125rem;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.3s;
        }
        
        .hero-actions .btn-primary {
          background: white;
          color: #667eea;
        }
        
        .hero-actions .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .hero-actions .btn-secondary {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 2px solid white;
        }
        
        .hero-actions .btn-secondary:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .features {
          background: white;
          padding: 4rem 2rem;
        }
        
        .dark-mode .features {
          background: var(--bg-secondary);
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .features h2 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 3rem;
          color: #1F2937;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        
        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          transition: all 0.3s;
          border: 1px solid #E5E7EB;
        }
        
        .dark-mode .feature-card {
          background: var(--bg-primary);
          border-color: var(--gray-200);
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        
        .feature-card h3 {
          color: #667eea;
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .feature-card p {
          color: #6B7280;
          line-height: 1.6;
        }
        
        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 2.5rem;
          }
          .hero-content p {
            font-size: 1.125rem;
          }
        }
      `}</style>
      
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to SkillWise 🎓</h1>
          <p>Your AI-powered learning companion for skill development</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary">
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