"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import { FaPlay, FaCheck, FaFilter, FaChevronLeft, FaChevronRight, FaGraduationCap, FaEye, FaEyeSlash, FaVideo } from "react-icons/fa";

export default function FlashcardReview() {
    const [flashcards, setFlashcards] = useState([]);
    const [flipped, setFlipped] = useState({});
    const [learned, setLearned] = useState({});
    const [showOnlyUnlearned, setShowOnlyUnlearned] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [totalCards, setTotalCards] = useState(0);
    const limit = 9;

    const fetchFlashcards = () => {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        fetch(`http://localhost:8000/learn/api/flashcards/level/1?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                // Filter out cards with no video URLs
                const validCards = Array.isArray(data) 
                    ? data.filter(card => card.video_url && card.video_url.trim() !== '')
                    : data.flashcards?.filter(card => card.video_url && card.video_url.trim() !== '') || [];
                
                setFlashcards(validCards);
                setTotalCards(data.total || validCards.length);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch flashcards:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFlashcards();
    }, [page]);

    const toggleFlip = (id) => {
        setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleLearned = async (id) => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`http://localhost:8000/learn/api/flashcards/${id}/learned`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setLearned(prev => ({ ...prev, [id]: data.status === "learned" }));
        } catch (err) {
            console.error("Failed to update learned status:", err);
        }
    };

    const filteredCards = flashcards.filter(card => 
        card.video_url && 
        card.video_url.trim() !== '' && 
        (!showOnlyUnlearned || (!card.learned && !learned[card.id]))
    );

    const learnedCount = flashcards.filter(card => card.learned || learned[card.id]).length;
    const totalValidCards = flashcards.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading flashcards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div 
                        className="bg-white rounded-2xl shadow-xl p-6 mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                    Flashcard Review
                                </h1>
                                <p className="text-gray-600">Study and master your vocabulary with interactive flashcards</p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                                        <FaGraduationCap className="text-green-600" />
                                        <span className="font-medium text-green-700">{learnedCount} Learned</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                                        <FaVideo className="text-purple-600" />
                                        <span className="font-medium text-purple-700">{totalValidCards} Total</span>
                                    </div>
                                </div>
                                
                                {/* Filter Button */}
                                <motion.button
                                    onClick={() => setShowOnlyUnlearned(prev => !prev)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        showOnlyUnlearned 
                                            ? "bg-purple-600 text-white shadow-lg" 
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaFilter />
                                    {showOnlyUnlearned ? (
                                        <>
                                            <FaEye /> Show All
                                        </>
                                    ) : (
                                        <>
                                            <FaEyeSlash /> Only Unlearned
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Learning Progress</span>
                                <span>{totalValidCards > 0 ? Math.round((learnedCount / totalValidCards) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <motion.div 
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${totalValidCards > 0 ? (learnedCount / totalValidCards) * 100 : 0}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Flashcards Grid */}
                    {filteredCards.length === 0 ? (
                        <motion.div 
                            className="bg-white rounded-2xl shadow-xl p-12 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="text-gray-400 mb-4">
                                <FaGraduationCap className="text-6xl mx-auto mb-4" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {showOnlyUnlearned ? "All cards learned!" : "No flashcards available"}
                            </h3>
                            <p className="text-gray-500">
                                {showOnlyUnlearned 
                                    ? "Great job! You've mastered all available flashcards." 
                                    : "Check back later for new flashcards to study."}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filteredCards.map((card, index) => (
                                    <motion.div
                                        key={card.id}
                                        className="relative w-full h-80 cursor-pointer [perspective:1000px] group"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={(e) => {e.preventDefault(); toggleFlip(card.id)}}
                                    >
                                        <motion.div
                                            className="absolute w-full h-full rounded-2xl shadow-xl [transform-style:preserve-3d] transition-transform duration-700"
                                            animate={{ rotateY: flipped[card.id] ? 180 : 0 }}
                                        >
                                            {/* Front Side */}
                                            <div className="absolute w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden] shadow-2xl">
                                                <div className="text-center">
                                                    <div className="mb-4">
                                                        <FaPlay className="text-white text-2xl mx-auto opacity-80" />
                                                    </div>
                                                    <h3 className="text-white text-2xl font-bold mb-2 break-words">
                                                        {card.gloss}
                                                    </h3>
                                                    <p className="text-white/80 text-sm">
                                                        Click to see video
                                                    </p>
                                                </div>
                                                
                                                {/* Decorative elements */}
                                                <div className="absolute top-4 right-4 w-3 h-3 bg-white/20 rounded-full"></div>
                                                <div className="absolute bottom-4 left-4 w-2 h-2 bg-white/20 rounded-full"></div>
                                                <div className="absolute top-8 left-6 w-1 h-1 bg-white/30 rounded-full"></div>
                                            </div>

                                            {/* Back Side */}
                                            <div className="absolute w-full h-full bg-white rounded-2xl p-4 flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl">
                                                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
                                                    <ReactPlayer 
                                                        url={card.video_url} 
                                                        controls 
                                                        width="100%" 
                                                        height="100%"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                <div className="mt-3 text-center">
                                                    <p className="text-gray-600 font-medium">{card.gloss}</p>
                                                    <p className="text-gray-400 text-sm">Click again to flip back</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                        
                                        {/* Learned Button */}
                                        <motion.button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation();
                                                toggleLearned(card.id);
                                            }}
                                            className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-2 text-sm font-medium rounded-full shadow-lg transition-all duration-200 z-10 ${
                                                card.learned || learned[card.id] 
                                                    ? "bg-green-500 text-white" 
                                                    : "bg-white text-gray-700 hover:bg-gray-50"
                                            }`}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {card.learned || learned[card.id] ? (
                                                    <>
                                                        <FaCheck className="text-sm" />
                                                        Learned
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaGraduationCap className="text-sm" />
                                                        Mark as Learned
                                                    </>
                                                )}
                                            </div>
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredCards.length > 0 && (
                        <motion.div 
                            className="flex justify-center items-center gap-4 mt-12"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                disabled={page === 1}
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                                    page === 1 
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                                }`}
                                whileHover={page !== 1 ? { scale: 1.05 } : {}}
                                whileTap={page !== 1 ? { scale: 0.95 } : {}}
                            >
                                <FaChevronLeft />
                                Previous
                            </motion.button>
                            
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg">
                                <span className="text-gray-600 font-medium">Page {page}</span>
                            </div>
                            
                            <motion.button
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={filteredCards.length < limit}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                                    filteredCards.length < limit
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:from-purple-600 hover:to-pink-600 hover:shadow-xl"
                                }`}
                                whileHover={filteredCards.length >= limit ? { scale: 1.05 } : {}}
                                whileTap={filteredCards.length >= limit ? { scale: 0.95 } : {}}
                            >
                                Next
                                <FaChevronRight />
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}