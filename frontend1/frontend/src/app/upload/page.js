'use client';

import { useState } from "react";

export default function UploadForm() {
    const [videoFile, setVideoFile] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const jwtToken = "YOUR_JWT_TOKEN"; // Replace or get from context

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile) return;

        const formData = new FormData();
        formData.append("file", videoFile);

        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/predict-video", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Error occurred");
            setPrediction(data.prediction);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
            <input
                type="file"
                accept="video/mp4"
                onChange={(e) => {
                    const file = e.target.files ? e.target.files[0] : null;
                    setVideoFile(file);
                }}
            />

            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={loading || !videoFile}
            >
                {loading ? "Predicting..." : "Upload & Predict"}
            </button>
            {prediction && (
                <div className="mt-4 text-xl">
                    Prediction: <strong>{prediction}</strong>
                </div>
            )}
        </form>
    );
}
