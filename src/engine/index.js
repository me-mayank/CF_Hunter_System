import { computeHunterRank } from './hunterRank.js';
import { computeMonsterDistribution } from './monsterDistribution.js';
import { computeCombatProficiency } from './combatProficiency.js';
import { computeActiveDaysAndStreaks } from './activeDaysAndStreaks.js';
import { computeProblemDiversity } from './problemDiversity.js';
import { computeHighestConsistentDifficulty } from './highestConsistentDifficulty.js';
import { computeContestExperience } from './contestExperience.js';
import { computeHunterLevel } from './hunterLevel.js';
import { computeManaPower } from './manaPower.js';
import { computeSkillAffinities } from './skillAffinities.js';
import { CURRENT_ENGINE_VERSION } from './engineVersion.js';

/**
 * Computes a full Hunter Profile from raw collected data.
 * This is a pure function.
 *
 * @param {object} collectedData - { userInfo, userStatus, userRating }
 * @param {object} previousProfile - Optional previous profile for incremental updates/decay
 * @param {object} config - System configuration (weights, thresholds, etc.)
 * @returns {object} Hunter Profile
 */
export function computeHunterProfile(collectedData, previousProfile = null, config = {}) {
  const { userInfo, userStatus, userRating } = collectedData;

  const hunterRank = computeHunterRank(userInfo);
  const { distribution: monsterDistribution, problemsDefeated } = computeMonsterDistribution(userStatus);
  const combatProficiency = computeCombatProficiency(monsterDistribution);
  const { activeDays, currentStreak, longestStreak } = computeActiveDaysAndStreaks(userStatus);
  const problemDiversityScore = computeProblemDiversity(monsterDistribution);
  
  const hcdThreshold = config.highestConsistentDifficultyThreshold || 10;
  const highestConsistentDifficulty = computeHighestConsistentDifficulty(monsterDistribution, hcdThreshold);
  
  // Highest Monster Defeated is simply the max rating solved
  const ratings = Object.keys(monsterDistribution).filter(k => k !== 'unrated').map(k => parseInt(k, 10));
  const highestMonsterDefeated = ratings.length > 0 ? Math.max(...ratings) : 0;

  const contestExperienceScore = computeContestExperience(userRating);

  const { skillAffinities, rawTagCounts } = computeSkillAffinities(userStatus);

  const prevLevel = previousProfile ? previousProfile.hunterLevel : 0;

  const hunterLevel = computeHunterLevel({
    rating: hunterRank.rating,
    problemDiversityScore,
    contestExperienceScore,
    activeDays,
    combatProficiency,
    previousHunterLevel: prevLevel
  }, config);

  const manaPower = computeManaPower({
    rating: hunterRank.rating,
    combatProficiency,
    contestExperienceScore,
    problemDiversityScore,
    activeDays
  }, config);

  return {
    handle: userInfo.handle.toLowerCase(),
    hunterRank,
    hunterLevel,
    manaPower,
    combatProficiency,
    problemsDefeated,
    highestMonsterDefeated,
    highestConsistentDifficulty,
    problemDiversityScore,
    contestExperienceScore,
    activeDays,
    currentStreak,
    longestStreak,
    monsterDistribution,
    skillAffinities,
    rawTagCounts,
    combatRecord: {
      monsterDistribution,
      tagDistribution: rawTagCounts
    },
    achievements: previousProfile ? previousProfile.achievements : [],
    metadata: {
      lastSubmissionId: getLatestSubmissionId(userStatus),
      lastContestId: getLatestContestId(userRating),
      lastUpdated: new Date().toISOString(),
      engineVersion: CURRENT_ENGINE_VERSION,
      registeredAt: previousProfile ? previousProfile.metadata.registeredAt : new Date().toISOString()
    }
  };
}

function getLatestSubmissionId(userStatus) {
  if (!userStatus || userStatus.length === 0) return 0;
  // CF returns userStatus sorted by creationTimeSeconds descending usually,
  // but let's be safe and find the max id.
  return Math.max(...userStatus.map(s => s.id));
}

function getLatestContestId(userRating) {
  if (!userRating || userRating.length === 0) return 0;
  return Math.max(...userRating.map(r => r.contestId));
}
