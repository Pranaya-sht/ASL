'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Glossalizer() {
    const [inputText, setInputText] = useState('');
    const [glossOutput, setGlossOutput] = useState([]);

    const handleGloss = async () => {
        const res = await fetch('http://localhost:8000/api/gloss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentence: inputText }),
        });

        const data = await res.json();
        setGlossOutput(data.gloss || []);
    };

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen flex flex-col items-center justify-center px-4">
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
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
                🔤 Convert to Gloss
            </button>

            {glossOutput.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md text-xl text-center"
                >
                    Gloss Output:{" "}
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {glossOutput.join(' ')}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
