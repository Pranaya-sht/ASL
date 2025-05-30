// React page to review incorrect answers and reset learned flashcards
"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

export default function ReviewIncorrectFlashcards() {
    const [incorrectAnswers, setIncorrectAnswers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        fetch("http://localhost:8000/learn/api/quiz/incorrect", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setIncorrectAnswers(data);
                setIsLoading(false);
            });
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Review Incorrect Answers</h1>
                        <p className="text-gray-600">Learn from your mistakes to improve your understanding</p>
                    </div>
                    {/* <button
                        onClick={handleResetLearned}
                        className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors duration-200 font-medium"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Learned Cards
                    </button> */}
                </div>

                {/* Stats Bar */}
                {incorrectAnswers.length > 0 && (
                    <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
                        <div className="flex items-center text-sm text-gray-600">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
                                <span className="font-medium">{incorrectAnswers.length}</span>
                                <span className="ml-1">incorrect answer{incorrectAnswers.length !== 1 ? 's' : ''} to review</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {incorrectAnswers.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Great job!</h3>
                        <p className="text-gray-600">No incorrect answers to review. Keep up the excellent work!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {incorrectAnswers.map((item, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                                {/* Video Player */}
                                <div className="aspect-video bg-gray-900 relative">
                                    <ReactPlayer 
                                        url={item.video_url} 
                                        controls 
                                        width="100%" 
                                        height="100%"
                                        className="absolute inset-0"
                                    />
                                </div>
                                
                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    {/* Your Answer */}
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                                            <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Your Answer</p>
                                            <p className="text-red-600 font-medium">{item.selected_answer}</p>
                                        </div>
                                    </div>

                                    {/* Correct Answer */}
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Correct Answer</p>
                                            <p className="text-green-600 font-medium">{item.correct_answer}</p>
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}