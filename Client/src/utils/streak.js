import dayjs from "dayjs";

/**
 * Calculates the current streak from a history object.
 * History object format: { "YYYY-MM-DD": { solved: boolean, ... } }
 * @param {Object} history 
 * @returns {number}
 */
export function calculateStreak(history) {
    if (!history || Object.keys(history).length === 0) return 0;

    let streak = 0;
    let current = dayjs().startOf("day");

    // If today isn't solved, check yesterday to see if streak is still alive
    if (!history[current.format("YYYY-MM-DD")]?.solved) {
        current = current.subtract(1, "day");
    }

    // Count backwards
    while (history[current.format("YYYY-MM-DD")]?.solved) {
        streak++;
        current = current.subtract(1, "day");
    }

    return streak;
}

/**
 * Maps puzzle stats to intensity levels (0-4)
 * @param {Object} entry 
 * @returns {number}
 */
export function getIntensity(entry) {
    if (!entry || !entry.solved) return 0;

    const { score, difficulty } = entry;

    if (score >= 1000) return 4;
    if (difficulty === "hard" || score >= 700) return 3;
    if (difficulty === "medium" || score >= 300) return 2;
    return 1;
}
