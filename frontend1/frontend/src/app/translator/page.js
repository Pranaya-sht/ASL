'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import VideoPlayer from '../../components/VideoPlayer';

export default function Glossalizer() {
    const [inputText, setInputText] = useState('');
    const [glossResult, setGlossResult] = useState({ glosses: [], videos: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGloss = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('http://localhost:8000/translator/gloss-videos/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentence: inputText }),
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();
            console.log("Backend response:", data);

            // Transform the response into the format we need
            const glossesArray = typeof data.glosses === 'string'
                ? data.glosses.split(' ')
                : Array.isArray(data.glosses)
                    ? data.glosses
                    : [];

            const videosArray = Array.isArray(data.videos)
                ? data.videos
                : [];

            setGlossResult({
                glosses: glossesArray,
                videos: videosArray
            });
        } catch (error) {
            console.error("Error fetching gloss:", error);
            setError(error.message || "Failed to process request");
            setGlossResult({ glosses: [], videos: [] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen flex flex-col items-center justify-center px-4 py-8">
            <motion.h1
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="text-4xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-500"
            >
                ✍️ Text to Sign Glossalizer
            </motion.h1>

            <textarea
                className="w-full max-w-md p-4 text-lg border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-900"
                rows={4}
                placeholder="Type a sentence... e.g., I am going to school"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />

            <button
                onClick={handleGloss}
                disabled={loading}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    '🔤 Convert to Gloss'
                )}
            </button>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg"
                >
                    {error}
                </motion.div>
            )}

            {glossResult.glosses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8 w-full max-w-4xl"
                >
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm">
                        <h2 className="text-xl font-semibold mb-2">Gloss Output:</h2>
                        <div className="flex flex-wrap gap-2">
                            {glossResult.glosses.map((gloss, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-mono"
                                >
                                    {gloss}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4 text-center">Sign Language Videos</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {glossResult.glosses.map((gloss, index) => (
                                <VideoPlayer
                                    key={index}
                                    videoId={glossResult.videos[index]}
                                    label={gloss}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}