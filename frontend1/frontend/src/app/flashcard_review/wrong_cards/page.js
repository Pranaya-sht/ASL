// React page to review incorrect answers and reset learned flashcards
"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

export default function ReviewIncorrectFlashcards() {
    const [incorrectAnswers, setIncorrectAnswers] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        fetch("http://localhost:8000/learn/api/quiz/incorrect", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setIncorrectAnswers);
    }, []);

    const handleResetLearned = async () => {
        const token = localStorage.getItem("access_token");
        const confirmed = window.confirm("Are you sure you want to reset all learned flashcards?");
        if (!confirmed) return;

        await fetch("http://localhost:8000/learn/api/flashcards/reset", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ All learned flashcards have been reset.");
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-blue-600">❌ Incorrect Answers Review</h1>

            <button
                onClick={handleResetLearned}
                className="bg-red-600 text-white px-4 py-2 rounded shadow"
            >
                Reset Learned Flashcards
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {incorrectAnswers.map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow space-y-2">
                        <ReactPlayer url={item.video_url} controls width="100%" height="200px" />
                        <p className="text-sm">❌ Your Answer: <strong className="text-red-500">{item.selected_answer}</strong></p>
                        <p className="text-sm">✅ Correct Answer: <strong className="text-green-600">{item.correct_answer}</strong></p>
                        <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
