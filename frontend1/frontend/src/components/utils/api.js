const API_BASE = "http://127.0.0.1:8000/learn/api"; // Adjust this based on your backend prefix

function getAccessToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem("access_token");
    }
    return null;
}

async function fetchWithAuth(url, options = {}) {
    const token = getAccessToken();
    const headers = options.headers || {};

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

// ================== Flashcards ==================

export async function getFlashcards(level, onlyUnlearned = false, page = 1, limit = 12) {
    const res = await fetchWithAuth(`${API_BASE}/flashcards/level/${level}?page=${page}&limit=${limit}&only_unlearned=${onlyUnlearned}`);
    if (!res.ok) throw new Error("Failed to fetch flashcards");
    return await res.json();
}

export async function markFlashcardLearned(flashcardId) {
    const res = await fetchWithAuth(`${API_BASE}/flashcards/${flashcardId}/learned`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to update flashcard status");
    return await res.json();
}

export async function resetLearnedFlashcards() {
    const res = await fetchWithAuth(`${API_BASE}/flashcards/reset`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to reset learned flashcards");
    return await res.json();
}

export async function sendFlashcardFeedback(flashcardId, liked) {
    const res = await fetchWithAuth(`${API_BASE}/flashcards/${flashcardId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked }),
    });
    if (!res.ok) throw new Error("Failed to send feedback");
    return await res.json();
}

// ================== Quiz ==================

export async function getQuiz(level) {
    const res = await fetchWithAuth(`${API_BASE}/quiz/level/${level}`);
    if (!res.ok) throw new Error("Failed to fetch quiz");
    return await res.json();
}

export async function submitQuiz(submission) {
    const res = await fetchWithAuth(`${API_BASE}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
    });
    if (!res.ok) throw new Error("Failed to submit quiz");
    return await res.json();
}

export async function getIncorrectAnswers() {
    const res = await fetchWithAuth(`${API_BASE}/quiz/incorrect`);
    if (!res.ok) throw new Error("Failed to fetch incorrect answers");
    return await res.json();
}

// ================== User Progress ==================

export async function getUserProgress() {
    const res = await fetchWithAuth(`${API_BASE}/user/progress`);
    if (!res.ok) throw new Error("Failed to fetch user progress");
    return await res.json();
}

export async function getUserAnalytics() {
    const res = await fetchWithAuth(`${API_BASE}/user/analytics`);
    if (!res.ok) throw new Error("Failed to fetch user analytics");
    return await res.json();
}

// ================== Daily Practice ==================

export async function getDailyPractice() {
    const res = await fetchWithAuth(`${API_BASE}/daily-practice`);
    if (!res.ok) throw new Error("Failed to fetch daily practice");
    return await res.json();
}

export async function completeDailyPractice(flashcardId) {
    const res = await fetchWithAuth(`${API_BASE}/daily-practice/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcard_id: flashcardId }),
    });
    if (!res.ok) throw new Error("Failed to mark practice as completed");
    return await res.json();
}

// ================== Reminders ==================

export async function createReminder(message, remindAt) {
    const res = await fetchWithAuth(`${API_BASE}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, remind_at: remindAt }),
    });
    if (!res.ok) throw new Error("Failed to create reminder");
    return await res.json();
}

export async function getUpcomingReminders() {
    const res = await fetchWithAuth(`${API_BASE}/reminders/upcoming`);
    if (!res.ok) throw new Error("Failed to fetch upcoming reminders");
    return await res.json();
}

export async function markReminderSent(reminderId) {
    const res = await fetchWithAuth(`${API_BASE}/reminders/${reminderId}/mark_sent`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to mark reminder as sent");
    return await res.json();
}

// ================== Dictionary ==================

export async function searchDictionary(query) {
    const res = await fetchWithAuth(`${API_BASE}/dictionary/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search dictionary");
    return await res.json();
}
