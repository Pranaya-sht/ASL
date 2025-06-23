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
<<<<<<< HEAD
  const [prediction, setPrediction] = useState('🤖');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastSentRef = useRef(0);
  const landmarksRef = useRef({
    pose: [],
    face: [],
    leftHand: [],
    rightHand: [],
  });

  useEffect(() => {
    let holistic;
    let camera;
    
    async function runHolisticTracking() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
=======
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
>>>>>>> main

        const ctx = canvas.getContext('2d');

<<<<<<< HEAD
      holistic = new window.Holistic({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
          modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        staticImageMode: false,
        enableFaceGeometry: false,
      });

      holistic.onResults((results) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        // Draw face landmarks
        if (results.faceLandmarks) {
          window.drawConnectors(
            ctx,
            results.faceLandmarks,
            window.FACEMESH_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 }
          );
        }

        // Draw pose landmarks
        if (results.poseLandmarks) {
          window.drawConnectors(
            ctx,
            results.poseLandmarks,
            window.POSE_CONNECTIONS,
            { color: '#00FF00', lineWidth: 2 }
          );
          window.drawLandmarks(
            ctx,
            results.poseLandmarks.filter((_, i) => i % 4 === 0),
            { color: '#00AA00', radius: 2 }
          );
        }

        // Draw left hand landmarks
        if (results.leftHandLandmarks) {
          window.drawConnectors(
            ctx,
            results.leftHandLandmarks,
            window.HAND_CONNECTIONS,
            { color: '#00BFFF', lineWidth: 2 }
          );
          window.drawLandmarks(
            ctx,
            results.leftHandLandmarks,
            { color: '#FF0000', lineWidth: 1 }
          );
        }

        // Draw right hand landmarks
        if (results.rightHandLandmarks) {
          window.drawConnectors(
            ctx,
            results.rightHandLandmarks,
            window.HAND_CONNECTIONS,
            { color: '#FFA500', lineWidth: 2 }
          );
          window.drawLandmarks(
            ctx,
            results.rightHandLandmarks,
            { color: '#00FF00', lineWidth: 1 }
          );
        }

        // Update landmarks in backend-compatible format
        landmarksRef.current = {
          pose: results.poseLandmarks ? 
            results.poseLandmarks.map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility
            })) : [],
          face: results.faceLandmarks ? 
            results.faceLandmarks.map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z
            })) : [],
          leftHand: results.leftHandLandmarks ? 
            results.leftHandLandmarks.map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z
            })) : [],
          rightHand: results.rightHandLandmarks ? 
            results.rightHandLandmarks.map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z
            })) : [],
        };

        ctx.restore();
      });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        video.srcObject = stream;
        
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });
        
        video.play();
        video.width = video.videoWidth;
        video.height = video.videoHeight;
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
      } catch (err) {
        console.error('Camera Error:', err);
        setError('Camera access denied. Please enable camera permissions.');
      }
    }

    // Initialize MediaPipe
    if (window.Holistic && window.Camera) {
      runHolisticTracking();
    } else {
      // Fallback in case scripts don't load properly
      const loadScripts = () => {
        if (window.Holistic && window.Camera) {
          runHolisticTracking();
        }
      };
      
      window.addEventListener('mediapipeLoaded', loadScripts);
      return () => window.removeEventListener('mediapipeLoaded', loadScripts);
    }

    // Prediction interval
    const predictionInterval = setInterval(async () => {
      const now = Date.now();
      const data = landmarksRef.current;
      
      // Check if any landmarks exist
      const hasData = Object.values(data).some(arr => arr.length > 0);
      if (!hasData || now - lastSentRef.current < 1000) return;

      lastSentRef.current = now;
      setIsLoading(true);
      
      try {
        const token = localStorage.getItem('access_token') || '';
        const res = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ landmarks: data }),
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const resData = await res.json();
        setPrediction(resData.prediction || '❓');
        setError(null);
      } catch (err) {
        console.error('Prediction Error:', err);
        setError('Prediction service unavailable');
        setPrediction('❌');
      } finally {
        setIsLoading(false);
=======
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
>>>>>>> main
      }
    }

<<<<<<< HEAD
    // Cleanup function
=======
    const timer = setTimeout(() => {
      if (window.Holistic && window.Camera) {
        setupCameraAndMediaPipe();
      } else {
        setError('MediaPipe failed to load');
      }
    }, 1000);

    // Cleanup
>>>>>>> main
    return () => {
      clearTimeout(timer);
      if (camera) {
        camera.stop();
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (holistic) {
        holistic.close();
      }
      if (camera) {
        camera.stop();
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
<<<<<<< HEAD
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="beforeInteractive" />

      <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-300 via-purple-500 to-pink-400 dark:from-gray-900 dark:via-gray-800 dark:to-black ">
=======
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
>>>>>>> main

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