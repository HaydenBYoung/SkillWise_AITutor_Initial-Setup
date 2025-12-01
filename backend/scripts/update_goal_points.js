const db = require('../src/database/connection');

async function updateGoalPoints() {
  try {
    const result = await db.query(`
      UPDATE goals 
      SET points_required = CASE 
        WHEN difficulty_level = 'easy' THEN 20 
        WHEN difficulty_level = 'medium' THEN 50 
        WHEN difficulty_level = 'hard' THEN 80 
        ELSE 50 
      END
    `);
    console.log('✅ Updated existing goals with new point requirements!');
    console.log(`   Rows affected: ${result.rowCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating goals:', error);
    process.exit(1);
  }
}

updateGoalPoints();
