'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Script from 'next/script';

// --- Constants ---
const SEQUENCE_LENGTH = 30;
const API_ENDPOINT = 'http://127.0.0.1:8000/predict';
const EXPECTED_LANDMARKS_PER_FRAME = 53; // 11 pose + 21 left + 21 right

export default function Page() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState('...');
  const [confidence, setConfidence] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState('');

  // Ref to hold the sequence of landmarks
  const landmarkSequenceRef = useRef([]);

  useEffect(() => {
    let holistic, camera;
    async function setupCameraAndMediaPipe() {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !window.Holistic || !window.Camera) {
          setError('MediaPipe dependencies not loaded');
          return;
        }

        const ctx = canvas.getContext('2d');

        holistic = new window.Holistic({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
        });

        holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        // --- Main callback for processing results ---
        holistic.onResults((results) => {
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          const importantPoseLandmarks = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26];

          // Draw Pose
          if (results.poseLandmarks) {
            const visiblePoseLandmarks = results.poseLandmarks.filter((_, i) => importantPoseLandmarks.includes(i));
            window.drawConnectors(ctx, visiblePoseLandmarks, window.POSE_CONNECTIONS, { color: '#4287f5', lineWidth: 4 });
            window.drawLandmarks(ctx, visiblePoseLandmarks, { color: '#f54242', lineWidth: 2 });
          }

          // Draw Hands
          if (results.leftHandLandmarks) {
            window.drawConnectors(ctx, results.leftHandLandmarks, window.HAND_CONNECTIONS, { color: '#fafafa', lineWidth: 2 });
            window.drawLandmarks(ctx, results.leftHandLandmarks, { color: '#f7ab0a', lineWidth: 1 });
          }
          if (results.rightHandLandmarks) {
            window.drawConnectors(ctx, results.rightHandLandmarks, window.HAND_CONNECTIONS, { color: '#fafafa', lineWidth: 2 });
            window.drawLandmarks(ctx, results.rightHandLandmarks, { color: '#f7ab0a', lineWidth: 1 });
          }

          ctx.restore();

          // --- Keypoint Extraction and Sequencing Logic ---
          const hasHands = results.leftHandLandmarks || results.rightHandLandmarks;
          if (hasHands) {
            let keypoints = [];

            // Pose landmarks (11) with visibility
            importantPoseLandmarks.forEach(idx => {
              const lm = results.poseLandmarks?.[idx] || { x: 0, y: 0, z: 0, visibility: 0 };
              keypoints.push({ x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility });
            });

            // Left hand landmarks (21) without visibility
            const leftHand = results.leftHandLandmarks || Array(21).fill({ x: 0, y: 0, z: 0 });
            leftHand.forEach(lm => keypoints.push({ x: lm.x, y: lm.y, z: lm.z }));

            // Right hand landmarks (21) without visibility
            const rightHand = results.rightHandLandmarks || Array(21).fill({ x: 0, y: 0, z: 0 });
            rightHand.forEach(lm => keypoints.push({ x: lm.x, y: lm.y, z: lm.z }));

            // Validate we have the correct number of landmarks
            if (keypoints.length !== EXPECTED_LANDMARKS_PER_FRAME) {
              console.error(`Expected ${EXPECTED_LANDMARKS_PER_FRAME} landmarks, got ${keypoints.length}`);
              return;
            }

            // Add to the sequence
            landmarkSequenceRef.current.push(keypoints);

            // If sequence is full, send for prediction
            if (landmarkSequenceRef.current.length === SEQUENCE_LENGTH) {
              sendForPrediction([...landmarkSequenceRef.current]);
              landmarkSequenceRef.current = [];
            }
          } else {
            // If no hands are detected, reset the sequence
            landmarkSequenceRef.current = [];
          }
        });

        // Setup and start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        });
        video.srcObject = stream;

        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        camera = new window.Camera(video, {
          onFrame: async () => {
            await holistic.send({ image: video });
          },
          width: video.videoWidth,
          height: video.videoHeight,
        });

        camera.start();
        setIsCameraReady(true);
        setError('');
      } catch (err) {
        console.error('Camera setup error:', err);
        setError(`Camera error: ${err.message}`);
      }
    }

    const timer = setTimeout(() => {
      if (window.Holistic && window.Camera) {
        setupCameraAndMediaPipe();
      } else {
        setError('MediaPipe failed to load');
      }
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (camera) {
        camera.stop();
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // --- Function to send data to the backend ---
  async function sendForPrediction(sequence) {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.prediction) {
        setPrediction(data.prediction);
        setConfidence(data.confidence);
      }
    } catch (err) {
      console.error('Prediction Error:', err);
      setPrediction('Error');
      setError(err.message);
    }
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js"
        strategy="beforeInteractive"
        onError={() => setError('Failed to load MediaPipe Holistic')}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
        strategy="beforeInteractive"
        onError={() => setError('Failed to load Camera Utils')}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="beforeInteractive"
        onError={() => setError('Failed to load Drawing Utils')}
      />

      <div className="bg-gray-950 text-white min-h-screen flex flex-col items-center justify-center p-4">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold text-white mb-4 tracking-wide"
        >
          Live ASL Recognition
        </motion.h1>

        <div className="relative w-full max-w-4xl aspect-video rounded-lg shadow-2xl border-4 border-blue-500 bg-black flex items-center justify-center">
          <video ref={videoRef} className="hidden" playsInline />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-md" />
          {!isCameraReady && !error && (
            <p className="text-xl">Initializing Camera...</p>
          )}
          {error && (
            <div className="text-red-500 text-center p-4 bg-red-900 bg-opacity-50 rounded-lg">
              <p className="text-xl font-bold">Error</p>
              <p>{error}</p>
              <button
                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-xl text-gray-400">Predicted Sign</p>
          <div className="text-6xl font-semibold text-blue-400 my-2 h-20 flex items-center justify-center">
            {prediction}
          </div>
          <div className="w-64 bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Confidence: {(confidence * 100).toFixed(1)}%
          </p>
        </motion.div>
      </div>
    </>
  );
}