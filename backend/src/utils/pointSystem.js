/**
 * Point System Configuration and Calculation
 *
 * This module defines the point values for various user activities
 * and provides utilities for calculating points and levels.
 */

const POINT_VALUES = {
  // Challenge completion points (based on difficulty)
  CHALLENGE_EASY: 10,
  CHALLENGE_MEDIUM: 25,
  CHALLENGE_HARD: 50,

  // Goal completion bonus
  GOAL_COMPLETE: 100,

  // Peer review points
  PEER_REVIEW_GIVEN: 15,
  PEER_REVIEW_RECEIVED: 5,
  PEER_REVIEW_QUALITY_BONUS: 10, // For high-quality reviews

  // Streak bonuses
  STREAK_3_DAYS: 20,
  STREAK_7_DAYS: 50,
  STREAK_14_DAYS: 100,
  STREAK_30_DAYS: 250,

  // AI feedback engagement
  AI_FEEDBACK_RECEIVED: 5,
  AI_FEEDBACK_APPLIED: 10,

  // Achievement unlocks
  ACHIEVEMENT_BRONZE: 25,
  ACHIEVEMENT_SILVER: 50,
  ACHIEVEMENT_GOLD: 100,
};

/**
 * Level thresholds - linear growth (100 points per level)
 * Level 1: 0-99 points
 * Level 2: 100-199 points
 * Level 3: 200-299 points
 * Level 4: 300-399 points
 * etc.
 */
function getLevelThresholds() {
  const thresholds = [0];
  for (let i = 1; i <= 100; i++) {
    thresholds.push(i * 100);
  }
  return thresholds;
}

const LEVEL_THRESHOLDS = getLevelThresholds();

/**
 * Calculate points for challenge completion
 * @param {string} difficulty - Challenge difficulty level
 * @param {number} timeSpent - Time spent in minutes
 * @param {boolean} firstAttempt - Whether this is the first attempt
 * @returns {number} Points earned
 */
function calculateChallengePoints(
  difficulty,
  timeSpent = 0,
  firstAttempt = true
) {
  let basePoints = 0;

  switch (difficulty.toLowerCase()) {
    case 'easy':
      basePoints = POINT_VALUES.CHALLENGE_EASY;
      break;
    case 'medium':
      basePoints = POINT_VALUES.CHALLENGE_MEDIUM;
      break;
    case 'hard':
      basePoints = POINT_VALUES.CHALLENGE_HARD;
      break;
    default:
      basePoints = POINT_VALUES.CHALLENGE_EASY;
  }

  // Bonus for first attempt success
  if (firstAttempt) {
    basePoints *= 1.5;
  }

  // Small bonus for time efficiency (completed in under expected time)
  const expectedTime = {
    easy: 30,
    medium: 60,
    hard: 120,
  };

  if (timeSpent > 0 && timeSpent < expectedTime[difficulty.toLowerCase()]) {
    basePoints += Math.floor(basePoints * 0.2);
  }

  return Math.floor(basePoints);
}

/**
 * Calculate points for goal completion
 * @param {number} challengesCompleted - Number of challenges in the goal
 * @param {number} daysToComplete - Days taken to complete the goal
 * @returns {number} Points earned
 */
function calculateGoalPoints(challengesCompleted, daysToComplete = 0) {
  let points = POINT_VALUES.GOAL_COMPLETE;

  // Bonus for completing multiple challenges
  if (challengesCompleted >= 5) {
    points += 50;
  }
  if (challengesCompleted >= 10) {
    points += 100;
  }

  // Bonus for quick completion
  if (daysToComplete > 0 && daysToComplete <= 7) {
    points += 50;
  }

  return points;
}

/**
 * Calculate points for peer review
 * @param {number} rating - Rating given by reviewee (1-5)
 * @param {number} reviewLength - Length of review text
 * @param {boolean} hasStructuredFeedback - Whether review includes structured feedback
 * @returns {number} Points earned
 */
function calculatePeerReviewPoints(
  rating = 0,
  reviewLength = 0,
  hasStructuredFeedback = false
) {
  let points = POINT_VALUES.PEER_REVIEW_GIVEN;

  // Quality bonus based on rating from reviewee
  if (rating >= 4) {
    points += POINT_VALUES.PEER_REVIEW_QUALITY_BONUS;
  }

  // Bonus for detailed review (300+ characters)
  if (reviewLength >= 300) {
    points += 5;
  }

  // Bonus for structured feedback
  if (hasStructuredFeedback) {
    points += 10;
  }

  // Cap at 10 points maximum
  return Math.min(points, 10);
}

/**
 * Calculate streak bonus
 * @param {number} streakDays - Current streak in days
 * @returns {number} Bonus points
 */
function calculateStreakBonus(streakDays) {
  if (streakDays >= 30) return POINT_VALUES.STREAK_30_DAYS;
  if (streakDays >= 14) return POINT_VALUES.STREAK_14_DAYS;
  if (streakDays >= 7) return POINT_VALUES.STREAK_7_DAYS;
  if (streakDays >= 3) return POINT_VALUES.STREAK_3_DAYS;
  return 0;
}

/**
 * Calculate user level based on total points
 * @param {number} totalPoints - User's total points
 * @returns {object} Level and progress information
 */
function calculateLevel(totalPoints) {
  let level = 1;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextLevelThreshold =
    LEVEL_THRESHOLDS[level] ||
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
  const pointsInCurrentLevel = totalPoints - currentLevelThreshold;
  const pointsNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const progressPercent = Math.floor(
    (pointsInCurrentLevel / pointsNeededForNextLevel) * 100
  );

  return {
    level,
    currentLevelThreshold,
    nextLevelThreshold,
    pointsInCurrentLevel,
    pointsNeededForNextLevel,
    progressPercent,
    pointsToNextLevel: nextLevelThreshold - totalPoints,
  };
}

/**
 * Update streak and calculate bonus
 * @param {Date} lastActivityDate - Date of last activity
 * @param {number} currentStreak - Current streak count
 * @returns {object} Updated streak information
 */
function updateStreak(lastActivityDate, currentStreak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastActivityDate) {
    return { currentStreak: 1, streakBonus: 0, isNewStreak: true };
  }

  const lastActivity = new Date(lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

  let newStreak = currentStreak || 0;
  let isNewStreak = false;

  if (daysDiff === 0) {
    // Same day - no change
    newStreak = currentStreak;
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    newStreak = currentStreak + 1;
    isNewStreak = true;
  } else {
    // Streak broken - restart
    newStreak = 1;
    isNewStreak = true;
  }

  const streakBonus = isNewStreak ? calculateStreakBonus(newStreak) : 0;

  return {
    currentStreak: newStreak,
    streakBonus,
    isNewStreak,
  };
}

/**
 * Calculate percentile rank
 * @param {number} userRank - User's rank position
 * @param {number} totalUsers - Total number of users
 * @returns {number} Percentile (0-100)
 */
function calculatePercentile(userRank, totalUsers) {
  if (totalUsers <= 0) return 100;
  return Math.max(
    0,
    Math.min(100, Math.floor(((totalUsers - userRank + 1) / totalUsers) * 100))
  );
}

module.exports = {
  POINT_VALUES,
  LEVEL_THRESHOLDS,
  calculateChallengePoints,
  calculateGoalPoints,
  calculatePeerReviewPoints,
  calculateStreakBonus,
  calculateLevel,
  updateStreak,
  calculatePercentile,
};
