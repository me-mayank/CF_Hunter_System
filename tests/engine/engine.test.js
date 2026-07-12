import { computeHunterRank } from '../../src/engine/hunterRank.js';
import { computeMonsterDistribution } from '../../src/engine/monsterDistribution.js';
import { getWeight, computeCombatProficiency } from '../../src/engine/combatProficiency.js';
import { computeActiveDaysAndStreaks } from '../../src/engine/activeDaysAndStreaks.js';
import { computeHighestConsistentDifficulty } from '../../src/engine/highestConsistentDifficulty.js';
import { computeContestExperience } from '../../src/engine/contestExperience.js';
import { computeSkillAffinities } from '../../src/engine/skillAffinities.js';
import { computeHunterProfile } from '../../src/engine/index.js';

describe('Hunter Engine Core', () => {

  const mockUserInfo = {
    handle: 'tourist',
    rating: 3500,
    rank: 'legendary grandmaster'
  };

  const mockUserStatus = [
    { id: 1, verdict: 'OK', creationTimeSeconds: 1600000000, problem: { contestId: 1, index: 'A', rating: 1200, tags: ['math'] } },
    { id: 2, verdict: 'OK', creationTimeSeconds: 1600086400, problem: { contestId: 1, index: 'B', rating: 1500, tags: ['dp', 'implementation'] } },
    { id: 3, verdict: 'WRONG_ANSWER', creationTimeSeconds: 1600086500, problem: { contestId: 1, index: 'C', rating: 1800, tags: ['graphs'] } },
    // duplicate AC, should be ignored
    { id: 4, verdict: 'OK', creationTimeSeconds: 1600086600, problem: { contestId: 1, index: 'A', rating: 1200, tags: ['math'] } },
  ];

  const mockUserRating = [
    { contestId: 100, newRating: 1500, ratingUpdateTimeSeconds: 1500000000 },
    { contestId: 101, newRating: 1700, ratingUpdateTimeSeconds: 1501000000 },
    { contestId: 102, newRating: 1650, ratingUpdateTimeSeconds: 1502000000 }
  ];

  test('computeHunterRank', () => {
    const rank = computeHunterRank(mockUserInfo);
    expect(rank.rating).toBe(3500);
    expect(rank.rank).toBe('legendary grandmaster');
  });

  test('computeMonsterDistribution', () => {
    const { distribution, problemsDefeated } = computeMonsterDistribution(mockUserStatus);
    expect(problemsDefeated).toBe(2);
    expect(distribution['1200']).toBe(1);
    expect(distribution['1500']).toBe(1);
    expect(distribution['1800']).toBeUndefined(); // WA
  });

  test('getWeight and computeCombatProficiency', () => {
    expect(getWeight(1500)).toBe(19);
    expect(getWeight(800)).toBe(1);
    expect(getWeight(2400)).toBe(139); // Extrapolation test
    
    const score = computeCombatProficiency({ '1200': 1, '1500': 1 });
    expect(score).toBe(7 + 19); // 26
  });

  test('computeActiveDaysAndStreaks', () => {
    const { activeDays, currentStreak, longestStreak } = computeActiveDaysAndStreaks(mockUserStatus);
    expect(activeDays).toBe(2); // Two different days
    expect(longestStreak).toBe(2);
    expect(currentStreak).toBe(2);
  });

  test('computeHighestConsistentDifficulty', () => {
    const dist = { '1200': 15, '1500': 10, '1800': 5 };
    const hcd = computeHighestConsistentDifficulty(dist, 10);
    expect(hcd).toBe(1500);
  });

  test('computeContestExperience', () => {
    const exp = computeContestExperience(mockUserRating);
    expect(exp).toBeGreaterThan(0);
    expect(exp).toBeLessThanOrEqual(100);
  });

  test('computeSkillAffinities', () => {
    const { skillAffinities, rawTagCounts } = computeSkillAffinities(mockUserStatus);
    expect(skillAffinities.Strength).toBe(1); // implementation
    expect(skillAffinities.Intelligence).toBe(1); // dp
    expect(skillAffinities.Magic).toBe(1); // math
    expect(rawTagCounts['dp']).toBe(1);
    expect(rawTagCounts['graphs']).toBeUndefined(); // WA
  });

  test('computeHunterProfile creates complete profile', () => {
    const profile = computeHunterProfile({
      userInfo: mockUserInfo,
      userStatus: mockUserStatus,
      userRating: mockUserRating
    }, null, { maxCombatProficiency: 50000 });
    
    expect(profile.handle).toBe('tourist');
    expect(profile.hunterRank.rating).toBe(3500);
    expect(profile.problemsDefeated).toBe(2);
    expect(profile.highestMonsterDefeated).toBe(1500);
    expect(profile.metadata.engineVersion).toBeDefined();
    expect(profile.combatRecord).toBeDefined();
  });

});
