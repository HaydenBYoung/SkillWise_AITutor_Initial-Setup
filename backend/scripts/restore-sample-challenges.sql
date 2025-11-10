-- Restore Sample Challenges for SkillWise Platform
-- This script adds back the sample challenges that were lost during testing

-- First, let's clear any existing challenges to avoid duplicates
DELETE FROM challenges;

-- Reset the sequence to start from 1
ALTER SEQUENCE challenges_id_seq RESTART WITH 1;

-- Programming Challenges (Easy: 1pt, Medium: 2pts, Hard: 3pts)
INSERT INTO challenges (title, description, category, difficulty_level, points, created_at, updated_at) VALUES

-- Easy Programming Challenges (1 point each)
('Hello World Program', 'Write a program that outputs "Hello, World!" to the console. This is the classic first program for any programming language.', 'Programming', 'easy', 1, NOW(), NOW()),
('Variable Declaration', 'Declare variables of different data types (string, integer, boolean) and assign values to them.', 'Programming', 'easy', 1, NOW(), NOW()),
('Simple Calculator', 'Create a basic calculator that can add two numbers together and display the result.', 'Programming', 'easy', 1, NOW(), NOW()),
('Print Your Name', 'Write a program that asks for your name and then prints "Hello, [Your Name]!" to the screen.', 'Programming', 'easy', 1, NOW(), NOW()),
('Count to Ten', 'Write a program that prints numbers from 1 to 10 using a loop.', 'Programming', 'easy', 1, NOW(), NOW()),

-- Medium Programming Challenges (2 points each)
('Fibonacci Sequence', 'Write a function that generates the first 10 numbers in the Fibonacci sequence.', 'Programming', 'medium', 2, NOW(), NOW()),
('FizzBuzz Problem', 'Write a program that prints numbers 1 to 100, but prints "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for multiples of both.', 'Programming', 'medium', 2, NOW(), NOW()),
('Array Manipulation', 'Create an array of numbers, then write functions to find the maximum, minimum, and average values.', 'Programming', 'medium', 2, NOW(), NOW()),
('String Reverser', 'Write a function that takes a string as input and returns the string reversed.', 'Programming', 'medium', 2, NOW(), NOW()),
('Prime Number Checker', 'Create a function that determines whether a given number is prime or not.', 'Programming', 'medium', 2, NOW(), NOW()),

-- Hard Programming Challenges (3 points each)
('Binary Search Algorithm', 'Implement the binary search algorithm to find an element in a sorted array efficiently.', 'Programming', 'hard', 3, NOW(), NOW()),
('Recursive Factorial', 'Write a recursive function to calculate the factorial of a given number.', 'Programming', 'hard', 3, NOW(), NOW()),
('Data Structure Implementation', 'Implement a basic stack data structure with push, pop, and peek operations.', 'Programming', 'hard', 3, NOW(), NOW()),
('Sorting Algorithm', 'Implement the bubble sort algorithm to sort an array of numbers in ascending order.', 'Programming', 'hard', 3, NOW(), NOW()),
('Pattern Matching', 'Write a program that can detect if a string matches a simple pattern (with wildcards).', 'Programming', 'hard', 3, NOW(), NOW()),

-- Web Development Challenges
-- Easy Web Development (1 point each)
('HTML Basic Page', 'Create a basic HTML page with a title, heading, and paragraph of text.', 'Web Development', 'easy', 1, NOW(), NOW()),
('CSS Styling', 'Add CSS styles to change the color, font, and background of an HTML page.', 'Web Development', 'easy', 1, NOW(), NOW()),
('Simple Form', 'Create an HTML form with input fields for name, email, and a submit button.', 'Web Development', 'easy', 1, NOW(), NOW()),

-- Medium Web Development (2 points each)
('Responsive Layout', 'Create a responsive web page layout that works on both desktop and mobile devices.', 'Web Development', 'medium', 2, NOW(), NOW()),
('JavaScript Interaction', 'Add JavaScript to make a button that changes the text of a paragraph when clicked.', 'Web Development', 'medium', 2, NOW(), NOW()),
('Form Validation', 'Implement client-side form validation using JavaScript to check required fields.', 'Web Development', 'medium', 2, NOW(), NOW()),

-- Hard Web Development (3 points each)
('AJAX API Call', 'Create a web page that fetches data from an API and displays it dynamically without page refresh.', 'Web Development', 'hard', 3, NOW(), NOW()),
('Local Storage', 'Build a web app that saves user preferences to local storage and remembers them on return visits.', 'Web Development', 'hard', 3, NOW(), NOW()),

-- Data Science Challenges
-- Easy Data Science (1 point each)
('Data Reading', 'Load a CSV file and display the first 5 rows of data.', 'Data Science', 'easy', 1, NOW(), NOW()),
('Basic Statistics', 'Calculate the mean, median, and mode of a dataset.', 'Data Science', 'easy', 1, NOW(), NOW()),

-- Medium Data Science (2 points each)
('Data Visualization', 'Create a bar chart or line graph to visualize a dataset.', 'Data Science', 'medium', 2, NOW(), NOW()),
('Data Cleaning', 'Clean a messy dataset by handling missing values and duplicates.', 'Data Science', 'medium', 2, NOW(), NOW()),

-- Hard Data Science (3 points each)
('Machine Learning Model', 'Build a simple linear regression model to predict house prices.', 'Data Science', 'hard', 3, NOW(), NOW()),
('Advanced Visualization', 'Create an interactive dashboard with multiple charts and filters.', 'Data Science', 'hard', 3, NOW(), NOW()),

-- Database Challenges
-- Easy Database (1 point each)
('Basic SELECT Query', 'Write a SQL query to select all records from a users table.', 'Databases', 'easy', 1, NOW(), NOW()),
('WHERE Clause', 'Use a WHERE clause to filter records based on specific criteria.', 'Databases', 'easy', 1, NOW(), NOW()),

-- Medium Database (2 points each)
('JOIN Operations', 'Write a SQL query that joins two tables to combine related data.', 'Databases', 'medium', 2, NOW(), NOW()),
('Database Design', 'Design a simple database schema for a library management system.', 'Databases', 'medium', 2, NOW(), NOW()),

-- Hard Database (3 points each)
('Complex Queries', 'Write advanced SQL queries using subqueries, aggregations, and window functions.', 'Databases', 'hard', 3, NOW(), NOW()),
('Database Optimization', 'Optimize slow database queries by adding appropriate indexes.', 'Databases', 'hard', 3, NOW(), NOW());

-- Display summary of what was added
SELECT 
    category,
    difficulty_level,
    COUNT(*) as challenge_count,
    SUM(points) as total_points
FROM challenges 
GROUP BY category, difficulty_level 
ORDER BY category, 
    CASE difficulty_level 
        WHEN 'easy' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'hard' THEN 3 
    END;

-- Show total count
SELECT COUNT(*) as total_challenges, SUM(points) as total_possible_points FROM challenges;