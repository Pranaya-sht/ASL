'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Script from 'next/script';

export default function Page() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState('🤖');
  const lastSentRef = useRef(0);
  const landmarksQueueRef = useRef();

  useEffect(() => {
    async function runHandTracking() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
              color: '#00BFFF',
              lineWidth: 2,
            });
            window.drawLandmarks(ctx, landmarks, {
              color: '#FF4500',
              lineWidth: 1,
            });

            landmarksQueueRef.current = landmarks;
          }
        } else {
          setPrediction('❓');
        }

        ctx.restore();
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await new Promise((res) => (video.onloadedmetadata = res));
      video.play();

      video.width = video.videoWidth;
      video.height = video.videoHeight;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const camera = new window.Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: video.videoWidth,
        height: video.videoHeight,
      });

      camera.start();
    }

    if (window.Hands && window.Camera) {
      runHandTracking();
    }

    const predictionInterval = setInterval(async () => {
      const now = Date.now();
      if (landmarksQueueRef.current && now - lastSentRef.current > 1000) {
        lastSentRef.current = now;
        const flatLandmarks = landmarksQueueRef.current.flatMap((pt) => [pt.x, pt.y, pt.z]);

        const token = localStorage.getItem('access_token');

        try {
          const res = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ landmarks: flatLandmarks }),
          });
          const data = await res.json();
          setPrediction(data.prediction || '❓');
        } catch (err) {
          console.error('Prediction Error:', err);
        }
      }
    }, 500);

    return () => {
      clearInterval(predictionInterval);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="beforeInteractive" />

      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-600 via-blue-400 to-red-500 p-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl font-bold text-white mb-6"
        >
          🖐️ ASL Live Tracker
        </motion.h1>

        <div className="relative">
          <video ref={videoRef} className="hidden" />
          <canvas ref={canvasRef} className="rounded-lg border-4 border-white" />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
          className="mt-6 text-2xl font-semibold text-white bg-gray-900 px-6 py-3 rounded-full"
        >
          Predicted Sign: <span className="text-blue-300">{prediction}</span>
        </motion.div>
      </div>
    </>
  );
}
