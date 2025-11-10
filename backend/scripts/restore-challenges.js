const { Client } = require('pg');

// Database connection configuration
const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'skillwise_db',
  user: 'skillwise_user',
  password: 'skillwise_pass',
});

const sampleChallenges = [
  // Easy Programming Challenges (1 point each)
  {
    title: 'Hello World Program',
    description: 'Write a program that outputs "Hello, World!" to the console. This is the classic first program for any programming language.',
    category: 'Programming',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'Variable Declaration',
    description: 'Declare variables of different data types (string, integer, boolean) and assign values to them.',
    category: 'Programming',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'Simple Calculator',
    description: 'Create a basic calculator that can add two numbers together and display the result.',
    category: 'Programming',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'Print Your Name',
    description: 'Write a program that asks for your name and then prints "Hello, [Your Name]!" to the screen.',
    category: 'Programming',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'Count to Ten',
    description: 'Write a program that prints numbers from 1 to 10 using a loop.',
    category: 'Programming',
    difficulty_level: 'easy',
    points: 1
  },

  // Medium Programming Challenges (2 points each)
  {
    title: 'Fibonacci Sequence',
    description: 'Write a function that generates the first 10 numbers in the Fibonacci sequence.',
    category: 'Programming',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'FizzBuzz Problem',
    description: 'Write a program that prints numbers 1 to 100, but prints "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for multiples of both.',
    category: 'Programming',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'Array Manipulation',
    description: 'Create an array of numbers, then write functions to find the maximum, minimum, and average values.',
    category: 'Programming',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'String Reverser',
    description: 'Write a function that takes a string as input and returns the string reversed.',
    category: 'Programming',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'Prime Number Checker',
    description: 'Create a function that determines whether a given number is prime or not.',
    category: 'Programming',
    difficulty_level: 'medium',
    points: 2
  },

  // Hard Programming Challenges (3 points each)
  {
    title: 'Binary Search Algorithm',
    description: 'Implement the binary search algorithm to find an element in a sorted array efficiently.',
    category: 'Programming',
    difficulty_level: 'hard',
    points: 3
  },
  {
    title: 'Recursive Factorial',
    description: 'Write a recursive function to calculate the factorial of a given number.',
    category: 'Programming',
    difficulty_level: 'hard',
    points: 3
  },
  {
    title: 'Data Structure Implementation',
    description: 'Implement a basic stack data structure with push, pop, and peek operations.',
    category: 'Programming',
    difficulty_level: 'hard',
    points: 3
  },

  // Web Development Challenges
  {
    title: 'HTML Basic Page',
    description: 'Create a basic HTML page with a title, heading, and paragraph of text.',
    category: 'Web Development',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'CSS Styling',
    description: 'Add CSS styles to change the color, font, and background of an HTML page.',
    category: 'Web Development',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'Responsive Layout',
    description: 'Create a responsive web page layout that works on both desktop and mobile devices.',
    category: 'Web Development',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'JavaScript Interaction',
    description: 'Add JavaScript to make a button that changes the text of a paragraph when clicked.',
    category: 'Web Development',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'AJAX API Call',
    description: 'Create a web page that fetches data from an API and displays it dynamically without page refresh.',
    category: 'Web Development',
    difficulty_level: 'hard',
    points: 3
  },

  // Data Science Challenges
  {
    title: 'Data Reading',
    description: 'Load a CSV file and display the first 5 rows of data.',
    category: 'Data Science',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'Data Visualization',
    description: 'Create a bar chart or line graph to visualize a dataset.',
    category: 'Data Science',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'Machine Learning Model',
    description: 'Build a simple linear regression model to predict house prices.',
    category: 'Data Science',
    difficulty_level: 'hard',
    points: 3
  },

  // Database Challenges
  {
    title: 'Basic SELECT Query',
    description: 'Write a SQL query to select all records from a users table.',
    category: 'Databases',
    difficulty_level: 'easy',
    points: 1
  },
  {
    title: 'JOIN Operations',
    description: 'Write a SQL query that joins two tables to combine related data.',
    category: 'Databases',
    difficulty_level: 'medium',
    points: 2
  },
  {
    title: 'Complex Queries',
    description: 'Write advanced SQL queries using subqueries, aggregations, and window functions.',
    category: 'Databases',
    difficulty_level: 'hard',
    points: 3
  }
];

async function restoreChallenges() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Clear existing challenges
    await client.query('DELETE FROM challenges');
    await client.query('ALTER SEQUENCE challenges_id_seq RESTART WITH 1');
    console.log('Cleared existing challenges');

    // Insert new challenges
    for (const challenge of sampleChallenges) {
      await client.query(
        'INSERT INTO challenges (title, description, category, difficulty_level, points, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [challenge.title, challenge.description, challenge.category, challenge.difficulty_level, challenge.points]
      );
    }

    console.log(`✅ Successfully restored ${sampleChallenges.length} sample challenges!`);

    // Show summary
    const result = await client.query(`
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
        END
    `);

    console.log('\n📊 Challenge Summary:');
    console.table(result.rows);

    const totalResult = await client.query('SELECT COUNT(*) as total_challenges, SUM(points) as total_possible_points FROM challenges');
    console.log(`\n🎯 Total: ${totalResult.rows[0].total_challenges} challenges worth ${totalResult.rows[0].total_possible_points} points`);

  } catch (error) {
    console.error('Error restoring challenges:', error);
  } finally {
    await client.end();
  }
}

restoreChallenges();