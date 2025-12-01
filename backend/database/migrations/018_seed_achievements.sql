-- Sample achievements data for milestone integration

INSERT INTO achievements (key, title, description, points) VALUES
('first-steps', 'First Steps', 'Completed your first challenge', 10),
('five-challenges', 'Challenge Enthusiast', 'Completed 5 challenges', 50),
('ten-challenges', 'Challenge Veteran', 'Completed 10 challenges', 100),
('challenge-master', 'Challenge Master', 'Completed 25 challenges', 250),
('challenge-legend', 'Challenge Legend', 'Completed 50 challenges', 500),
('consistent', 'Consistent Learner', 'Logged in 7 days in a row', 100),
('perfect-score', 'Perfect Score', 'Achieved 100% on a challenge', 50)
ON CONFLICT (key) DO NOTHING;
