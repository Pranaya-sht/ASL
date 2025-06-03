'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Script from 'next/script';

export default function Page() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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

      const ctx = canvas.getContext('2d');

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
      }
    }, 500);

    // Cleanup function
    return () => {
      clearInterval(predictionInterval);
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

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="beforeInteractive" />

      <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-300 via-purple-500 to-pink-400 dark:from-gray-900 dark:via-gray-800 dark:to-black ">

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
      </div>
    </>
  );
}
