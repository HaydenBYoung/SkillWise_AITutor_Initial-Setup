-- Migration 014: Add default challenges and update goal progress to use points
-- This creates basic challenges for the point-based system

-- First, let's create some default challenges for different categories
INSERT INTO challenges (title, description, instructions, category, difficulty_level, points_reward, max_attempts, is_active, tags, learning_objectives) VALUES

-- Programming Challenges
('Basic Variable Declaration', 'Learn to declare variables in programming', 'Enter the number 4 in the box below to complete the challenge', 'Programming', 'easy', 1, 3, true, ARRAY['variables', 'basics'], ARRAY['Understanding variable declaration']),
('Function Implementation', 'Create and use functions effectively', 'Enter the number 4 in the box below to complete the challenge', 'Programming', 'medium', 2, 3, true, ARRAY['functions', 'intermediate'], ARRAY['Function creation and usage']),
('Advanced Algorithm Design', 'Design complex algorithms for problem solving', 'Enter the number 4 in the box below to complete the challenge', 'Programming', 'hard', 3, 3, true, ARRAY['algorithms', 'advanced'], ARRAY['Algorithm design principles']),

-- Web Development Challenges  
('HTML Structure Basics', 'Build proper HTML document structure', 'Enter the number 4 in the box below to complete the challenge', 'Web Development', 'easy', 1, 3, true, ARRAY['html', 'structure'], ARRAY['HTML document structure']),
('CSS Styling Techniques', 'Apply advanced CSS styling methods', 'Enter the number 4 in the box below to complete the challenge', 'Web Development', 'medium', 2, 3, true, ARRAY['css', 'styling'], ARRAY['CSS styling techniques']),
('JavaScript DOM Manipulation', 'Master dynamic DOM manipulation with JavaScript', 'Enter the number 4 in the box below to complete the challenge', 'Web Development', 'hard', 3, 3, true, ARRAY['javascript', 'dom'], ARRAY['DOM manipulation skills']),

-- Data Science Challenges
('Data Analysis Fundamentals', 'Learn basic data analysis concepts', 'Enter the number 4 in the box below to complete the challenge', 'Data Science', 'easy', 1, 3, true, ARRAY['analysis', 'basics'], ARRAY['Data analysis fundamentals']),
('Statistical Modeling', 'Build statistical models for data insights', 'Enter the number 4 in the box below to complete the challenge', 'Data Science', 'medium', 2, 3, true, ARRAY['statistics', 'modeling'], ARRAY['Statistical modeling techniques']),
('Machine Learning Implementation', 'Implement advanced machine learning algorithms', 'Enter the number 4 in the box below to complete the challenge', 'Data Science', 'hard', 3, 3, true, ARRAY['ml', 'algorithms'], ARRAY['Machine learning implementation']),

-- Database Challenges
('SQL Query Basics', 'Write fundamental SQL queries', 'Enter the number 4 in the box below to complete the challenge', 'Databases', 'easy', 1, 3, true, ARRAY['sql', 'queries'], ARRAY['Basic SQL query writing']),
('Database Design Principles', 'Design efficient database schemas', 'Enter the number 4 in the box below to complete the challenge', 'Databases', 'medium', 2, 3, true, ARRAY['design', 'schema'], ARRAY['Database design principles']),
('Advanced Database Optimization', 'Optimize database performance and queries', 'Enter the number 4 in the box below to complete the challenge', 'Databases', 'hard', 3, 3, true, ARRAY['optimization', 'performance'], ARRAY['Database optimization techniques']);

-- Update the goal progress function to use points instead of challenge count
CREATE OR REPLACE FUNCTION update_goal_progress_points()
RETURNS TRIGGER AS $$
DECLARE
  total_points INTEGER;
  earned_points INTEGER;
  goal_target_points INTEGER;
  progress_pct INTEGER;
BEGIN
  -- Get the target points for the goal based on difficulty
  SELECT CASE 
    WHEN difficulty_level = 'easy' THEN 20
    WHEN difficulty_level = 'medium' THEN 35
    WHEN difficulty_level = 'hard' THEN 50
    ELSE 35
  END INTO goal_target_points
  FROM goals 
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  -- Calculate earned points from completed challenges
  SELECT COALESCE(SUM(c.points_reward), 0) INTO earned_points
  FROM goal_challenges gc
  JOIN challenges c ON gc.challenge_id = c.id
  WHERE gc.goal_id = COALESCE(NEW.goal_id, OLD.goal_id) 
    AND gc.status = 'completed';
  
  -- Calculate progress percentage
  progress_pct := CASE 
    WHEN goal_target_points > 0 THEN 
      LEAST(100, ROUND((earned_points * 100.0) / goal_target_points))
    ELSE 0
  END;
  
  -- Update goal progress and completion status
  UPDATE goals 
  SET 
    progress_percentage = progress_pct,
    is_completed = (earned_points >= goal_target_points),
    completion_date = CASE 
      WHEN (earned_points >= goal_target_points) AND completion_date IS NULL THEN NOW()
      WHEN (earned_points < goal_target_points) THEN NULL
      ELSE completion_date
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger and create new one
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON goal_challenges;
CREATE TRIGGER trigger_update_goal_progress_points
  AFTER INSERT OR UPDATE OR DELETE ON goal_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress_points();

-- Update existing goals to use the new point system (set target points based on difficulty)
UPDATE goals SET points_reward = CASE 
  WHEN difficulty_level = 'easy' THEN 20
  WHEN difficulty_level = 'medium' THEN 35  
  WHEN difficulty_level = 'hard' THEN 50
  ELSE 35
END;