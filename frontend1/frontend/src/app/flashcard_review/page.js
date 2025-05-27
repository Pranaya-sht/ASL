// Flashcard Review Page with flip animation, video preview, mark as learned, filter & pagination
// Dependencies: tailwindcss, react-player, framer-motion

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactPlayer from "react-player";

export default function FlashcardReview() {
    const [flashcards, setFlashcards] = useState([]);
    const [flipped, setFlipped] = useState({});
    const [learned, setLearned] = useState({});
    const [showOnlyUnlearned, setShowOnlyUnlearned] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 9;

    const fetchFlashcards = () => {
        const token = localStorage.getItem("access_token");
        fetch(`http://localhost:8000/learn/api/flashcards/level/1?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setFlashcards);
    };

    useEffect(() => {
        fetchFlashcards();
    }, [page]);

    const toggleFlip = (id) => {
        setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleLearned = async (id) => {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`http://localhost:8000/learn/api/flashcards/${id}/learned`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLearned(prev => ({ ...prev, [id]: data.status === "learned" }));
    };

    const filteredCards = flashcards.filter(card => !showOnlyUnlearned || !card.learned);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600">Flashcard Review</h1>
                <button
                    onClick={() => setShowOnlyUnlearned(prev => !prev)}
                    className="bg-gray-200 text-sm px-4 py-2 rounded shadow"
                >
                    {showOnlyUnlearned ? "Show All" : "Only Unlearned"}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredCards.map((card) => (
                    <motion.div
                        key={card.id}
                        className="relative w-full h-64 cursor-pointer [perspective:1000px]"
                        onClick={() => toggleFlip(card.id)}
                    >
                        <motion.div
                            className="absolute w-full h-full rounded-xl shadow-lg text-white [transform-style:preserve-3d] transition-transform duration-500"
                            animate={{ rotateY: flipped[card.id] ? 180 : 0 }}
                        >
                            {/* Front Side */}
                            <div className="absolute w-full h-full bg-blue-500 rounded-xl flex items-center justify-center backface-hidden">
                                <span className="text-2xl font-semibold">{card.gloss}</span>
                            </div>

                            {/* Back Side */}
                            <div className="absolute w-full h-full bg-white text-black rounded-xl p-2 flex items-center justify-center [transform:rotateY(180deg)] backface-hidden">
                                <ReactPlayer url={card.video_url} controls width="100%" height="100%" />
                            </div>
                        </motion.div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLearned(card.id);
                            }}
                            className={`absolute bottom-2 right-2 px-3 py-1 text-xs rounded-full shadow ${card.learned || learned[card.id] ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
                                }`}
                        >
                            {card.learned || learned[card.id] ? "Learned" : "Mark as Learned"}
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="bg-gray-200 px-4 py-2 rounded shadow disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => setPage(prev => prev + 1)}
                    className="bg-blue-500 text-white px-4 py-2 rounded shadow"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
