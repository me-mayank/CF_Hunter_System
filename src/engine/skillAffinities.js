const TAG_TO_ATTRIBUTE = {
  'implementation': 'Strength',
  'dp': 'Intelligence',
  'graphs': 'Perception',
  'math': 'Magic',
  'greedy': 'Agility',
  'binary search': 'Strategy',
};

/**
 * Computes Skill Affinities and raw tag counts.
 * Only counts tags from 'OK' submissions.
 * Deduplicates problems by contestId and index.
 *
 * @param {Array<object>} userStatus
 * @returns {object} { skillAffinities, rawTagCounts }
 */
export function computeSkillAffinities(userStatus) {
  const solved = new Set();
  const rawTagCounts = {};
  const skillAffinities = {
    Strength: 0,
    Intelligence: 0,
    Perception: 0,
    Magic: 0,
    Agility: 0,
    Strategy: 0,
  };

  for (const sub of userStatus) {
    if (sub.verdict === 'OK') {
      const problem = sub.problem;
      const key = `${problem.contestId || 'no-contest'}_${problem.index}`;

      if (!solved.has(key)) {
        solved.add(key);

        for (const tag of (problem.tags || [])) {
          const lowerTag = tag.toLowerCase();
          rawTagCounts[lowerTag] = (rawTagCounts[lowerTag] || 0) + 1;
          
          if (TAG_TO_ATTRIBUTE[lowerTag]) {
            const attr = TAG_TO_ATTRIBUTE[lowerTag];
            skillAffinities[attr]++;
          }
        }
      }
    }
  }

  return { skillAffinities, rawTagCounts };
}
