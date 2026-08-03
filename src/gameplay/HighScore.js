/**
 * LocalStorage high-score persistence.
 */

const STORAGE_KEY = 'hunt_the_karens_highscore';

export class HighScore {
    static load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            // localStorage unavailable
        }
        return { bestScore: 0, bestTime: 0, bestRank: 'D', bestCombo: 0 };
    }

    static save(data) {
        try {
            const existing = HighScore.load();
            const updated = {
                bestScore: Math.max(existing.bestScore, data.score || 0),
                bestTime: data.time > 0 && (existing.bestTime === 0 || data.time < existing.bestTime) ? data.time : existing.bestTime,
                bestRank: data.rank?.label || existing.bestRank,
                bestCombo: Math.max(existing.bestCombo, data.combo || 0),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        } catch (e) {
            // localStorage unavailable
            return { bestScore: 0, bestTime: 0, bestRank: 'D', bestCombo: 0 };
        }
    }
}
