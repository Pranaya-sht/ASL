import React from 'react';

export default function VideoPlayer({ videoId, label }) {
    if (!videoId) {
        return (
            <div className="text-center">
                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs mt-1 text-gray-500">No video for: {label}</span>
                </div>
            </div>
        );
    }

    const videoUrl = `http://localhost:8000/translator/video/${videoId}`;

    return (
        <div className="text-center">
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                    controls
                    className="w-full h-full object-contain"
                    src={videoUrl}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {label}
            </div>
        </div>
    );
}
