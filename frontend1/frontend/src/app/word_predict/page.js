"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ASLWebcamPredictor() {
    const videoRef = useRef(null);
    const [streaming, setStreaming] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [intervalId, setIntervalId] = useState(null);
    const [previousPrediction, setPreviousPrediction] = useState(null);

    const API_BASE = "http://localhost:8000/users/api/flashcards";

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStreaming(true);
            }
        } catch (err) {
            console.error("❌ Error accessing webcam:", err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setStreaming(false);

        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    const sendPredictionToBackend = async (newPrediction, token) => {
        try {
            const response = await fetch(`${API_BASE}/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ prediction: newPrediction }),
            });

            if (!response.ok) {
                console.error("❌ Failed to send prediction:", response.statusText);
            } else {
                const result = await response.json();
                console.log("✅ Prediction sent:", result);
            }
        } catch (error) {
            console.error("❌ Error sending prediction:", error);
        }
    };

    const startPredictionPolling = () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("⚠️ No access token in localStorage.");
            return;
        }

        const id = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE}/predict`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    console.error("❌ Backend GET error:", response.statusText);
                    return;
                }

                const data = await response.json();
                console.log("📡 Polled prediction:", data.prediction);

                if (data?.prediction) {
                    if (data.prediction !== previousPrediction) {
                        setPreviousPrediction(data.prediction);
                        await sendPredictionToBackend(data.prediction, token);
                    }
                    setPrediction(data.prediction);
                } else {
                    setPrediction("No prediction yet.");
                }
            } catch (error) {
                console.error("❌ Polling error:", error);
            }
        }, 3000);

        setIntervalId(id);
    };

    useEffect(() => {
        return () => {
            stopCamera(); // Cleanup when component unmounts
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-4 p-6 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-center">ASL Real-Time Predictor</h1>

            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-72 rounded-xl shadow-md border object-cover"
            />

            <div className="flex gap-4 mt-4">
                <Button onClick={startCamera} disabled={streaming}>
                    Start Camera
                </Button>
                <Button onClick={stopCamera} disabled={!streaming} variant="destructive">
                    Stop Camera
                </Button>
                <Button onClick={startPredictionPolling} disabled={intervalId !== null}>
                    Start Prediction
                </Button>
            </div>

            <div className="mt-6 text-xl text-center bg-gray-100 px-4 py-2 rounded-md shadow">
                <strong>Latest Prediction:</strong>{" "}
                <span className="text-indigo-600">{prediction ?? "No prediction yet."}</span>
            </div>
        </div>
    );
}
