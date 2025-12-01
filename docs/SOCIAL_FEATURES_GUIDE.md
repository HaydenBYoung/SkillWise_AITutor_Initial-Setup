# Social Features Guide

## How the Leaderboard & Peer Review Systems Work

### 🏆 Getting on the Leaderboard

Users earn points by completing various activities. Points automatically update their position on the leaderboard.

#### Point-Earning Activities:

1. **Complete Challenges** - `POST /api/challenges/:id/complete`

   - Easy: 10 points
   - Medium: 25 points
   - Hard: 50 points
   - First completion bonus: +50%
   - Perfect score bonus: +25%

2. **Complete Goals** - `POST /api/goals/:id/complete`

   - Base: 100 points
   - 100% completion bonus: +50 points
   - 90%+ completion bonus: +25 points

3. **Give Peer Reviews** - `POST /api/reviews/:reviewId`

   - Base: 15 points
   - Quality bonus (detailed review): +5-10 points

4. **Receive Peer Reviews** - Automatic

   - 5 points per review received

5. **Maintain Streaks**
   - 3-day streak: 20 points
   - 7-day streak: 50 points
   - 14-day streak: 100 points
   - 30-day streak: 250 points

### 📊 Leaderboard Features

- **Timeframes**: Daily, Weekly, Monthly, All-Time
- **Rankings**: Shows top users with rank, points, and level
- **Percentile**: Shows where you rank compared to all users
- **Level System**: 20 levels with exponential progression
- **Real-time Updates**: Rankings recalculate automatically

**API Endpoints:**

- `GET /api/leaderboard?timeframe=all-time&limit=50`
- `GET /api/leaderboard/me` - Your current rank
- `GET /api/leaderboard/surrounding` - Players near your rank

---

### 👥 Peer Review System

#### How Submissions Get Into Peer Review

**Automatic Assignment:**
When a user submits work for a challenge (`POST /api/submissions`), the system:

1. Creates the submission record
2. **Automatically assigns 2-3 peer reviewers** based on:
   - Similar skill level (within ±2 levels)
   - Review load balancing (users with fewer pending reviews)
   - Prevents self-review
   - Ensures variety (no reviewing the same person repeatedly)

#### Review Workflow

**Step 1: Submit Work**

```javascript
POST /api/submissions
{
  "challengeId": 123,
  "content": "My solution code...",
  "type": "code"
}
```

**Step 2: Get Assigned Reviews**
Reviewers check their pending reviews:

```javascript
GET / api / reviews / pending;
```

**Step 3: View Submission Details**

```javascript
GET /api/reviews/:reviewId
```

**Step 4: Submit Review**

```javascript
POST /api/reviews/:reviewId
{
  "reviewText": "Great work! Here's some feedback...",
  "rating": 4,
  "criteriaScores": {
    "clarity": 4,
    "completeness": 5,
    "code_quality": 4,
    "creativity": 3
  }
}
```

**Step 5: Check Received Feedback**

```javascript
GET / api / reviews / received;
```

#### Review Features

- **Anonymous Reviews**: Reviewers appear as "Anonymous Peer" to prevent bias
- **Structured Feedback**: 5-star rating + detailed criteria scoring
- **Quality Requirements**: Minimum 50 characters for review text
- **Point Rewards**: Both reviewer and reviewee earn points
- **Review History**: Track reviews given and received

---

## Frontend Integration

### Challenge Completion Button

Add a "Mark as Complete" button to challenge detail pages:

```javascript
const completeChallenge = async (challengeId) => {
  try {
    const response = await api.post(`/api/challenges/${challengeId}/complete`);
    alert(response.data.data.message); // "Challenge completed! You earned 25 points."
    // Refresh leaderboard and user stats
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};
```

### Goal Completion Button

Add a "Mark as Complete" button to goal detail pages:

```javascript
const completeGoal = async (goalId) => {
  try {
    const response = await api.post(`/api/goals/${goalId}/complete`);
    alert(response.data.data.message); // "Goal completed! You earned 100 points."
    // Refresh leaderboard and user stats
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};
```

### Viewing Peer Reviews

The PeerReview page (`/peer-review`) already has tabs for:

- **Pending**: Reviews you need to complete
- **Received**: Feedback you've received on your work
- **Given**: Reviews you've submitted

---

## Testing the System

### Scenario 1: Earn Points via Challenges

1. Create a user account
2. Create a goal
3. Create a challenge within that goal
4. Submit work for the challenge (`POST /api/submissions`)
5. Mark the challenge as complete (`POST /api/challenges/:id/complete`)
6. Check the leaderboard - you should see your points!

### Scenario 2: Peer Review Workflow

**Requires multiple users:**

1. **User A**: Create and submit a challenge solution

   - Auto-assigns User B and User C as reviewers

2. **User B**: Log in and navigate to Peer Review page

   - See User A's submission in "Pending" tab
   - Submit a review with feedback

3. **User A**: Check "Received" tab

   - See User B's anonymous feedback

4. **User B**: Check their points

   - Earned 15+ points for giving the review

5. **User A**: Check their points
   - Earned 5 points for receiving the review

### Scenario 3: Climb the Leaderboard

1. Complete multiple challenges (easy → medium → hard)
2. Complete goals
3. Review other users' work
4. Maintain daily login streak
5. Watch your level increase and rank improve!

---

## Database Tables

### Points & Rankings

- `user_statistics`: Total points, level, current rank, percentile
- `leaderboard`: Cached rankings by timeframe
- `progress_events`: History of all point-earning activities

### Peer Reviews

- `submissions`: User's submitted work
- `peer_reviews`: Review assignments and submitted reviews

---

## Configuration

### Point Values

Defined in `backend/src/utils/pointSystem.js`:

- Modify `POINT_VALUES` object to adjust point rewards
- Update `LEVEL_THRESHOLDS` array to change level progression

### Review Assignment Algorithm

Defined in `backend/src/services/peerReviewService.js`:

- Modify `assignReviewers()` function to change assignment logic
- Adjust number of reviewers, level range, or selection criteria

---

## Next Steps

1. ✅ Add "Mark as Complete" buttons to Challenge and Goal detail pages
2. ✅ Test with multiple users to verify peer review assignments
3. ✅ Monitor leaderboard updates as users earn points
4. 🔄 Add notifications when assigned new peer reviews
5. 🔄 Add achievement badges for milestones
6. 🔄 Add filters/search to leaderboard
