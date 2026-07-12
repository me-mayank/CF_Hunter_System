/**
 * Calculates active days, current streak, and longest streak from user submissions.
 * @param {Array<object>} userStatus
 * @returns {object} { activeDays, currentStreak, longestStreak }
 */
export function computeActiveDaysAndStreaks(userStatus) {
  // Get all unique dates of 'OK' submissions in YYYY-MM-DD format (UTC)
  const acDates = new Set();
  
  for (const sub of userStatus) {
    if (sub.verdict === 'OK' && sub.creationTimeSeconds) {
      const date = new Date(sub.creationTimeSeconds * 1000);
      const dateString = date.toISOString().split('T')[0];
      acDates.add(dateString);
    }
  }

  const sortedDates = Array.from(acDates).sort();
  const activeDays = sortedDates.length;

  if (activeDays === 0) {
    return { activeDays: 0, currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    
    // Difference in days
    const diffTime = Math.abs(currDate - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      runningStreak++;
    } else {
      runningStreak = 1;
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  // To calculate current streak, check if the last active day was "today" or "yesterday"
  // But wait, the system shouldn't depend on the time the job runs relative to the user's timezone tightly,
  // we'll define current streak as the streak ending on the *most recent AC date*.
  // PRD: "CurrentStreak = length of the consecutive-date run ending at 'today' (or the most recent AC date)"
  // So currentStreak is just the runningStreak at the end of the loop!
  const currentStreak = runningStreak;

  return { activeDays, currentStreak, longestStreak };
}
