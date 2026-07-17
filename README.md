<h1 align="center">ASL Learn & Translation System</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_15-Black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

> An interactive American Sign Language (ASL) learning and real-time translation system powered by Deep Learning, NLP, and Next.js.

This platform bridges the communication gap by combining a hybrid deep learning model for real-time webcam gesture translation, a rule-based English-to-ASL grammar glossizer, and a Next.js 15 dashboard featuring gamified learning progression, custom quizzes, and comprehensive analytics.

---

## Key Features

### 🎥 1. Real-Time ASL Video Translation
*   **Landmark Tracking:** Tracks user movements using MediaPipe Holistic (11 pose points, 21 left-hand points, and 21 right-hand points).
*   **Deep Learning Engine:** Translates sequence streams of 30 frames into dynamic word classifications using a hybrid `Conv1D` + `BiLSTM` + `Multi-Head Self-Attention` model.
*   **Performance Optimization:** Runs feature scaling and normalizations based on training set IQR and medians to deliver resilient, low-latency predictions.

### 📝 2. English-to-ASL Text Glossalizer
*   **ASL Grammar Engine:** Formulates written English phrases into standard ASL syntax order (`TIME` - `TOPIC` - `COMMENT` - `WH`).
*   **NLP Pipeline:** Utilizes NLTK tokenizers and lemmatizers to resolve contractions, handle spatial index mappings (e.g., *this*, *that*), replace pronouns, and conceptually isolate instrumental phrases.
*   **Video Playback:** Dynamically maps parsed tokens onto the WLASL dataset video streams, rendering translation videos in a seamless sequence.

### 🎮 3. Gamified Interactive Study Sandbox
*   **Dynamic Flashcards:** Study vocabulary with interactive dual-sided cards (Word on front, ASL demo video on back). Supports bookmarking, learned flags, and user feedback.
*   **Adaptive Quizzes:** Test your knowledge in a 10-level progressive quiz system featuring randomly generated video-based distractors.
*   **Daily Practice & Scheduler:** Generates 5 adaptive daily practice cards based on your current level, tracks your consistency streak, and includes a study scheduler for custom reminders.

###  4. Advanced Analytics & Visualized Progression
*   **Interactive Skill Trees:** Uses ReactFlow to generate interactive tree graphs mapping out your knowledge base (levels and concept tags).
*   **Visual Assessment Radar:** Radar charts measuring strength across Knowledge, Practice, Accuracy, Satisfaction, Quizzes, Completion, and Engagement.
*   **Consistency Heatmap:** Visualizes daily platform activity over a 30-day period.

---

## Technical Architecture

```text
  [ USER TEXT INPUT ]                    [ WEBCAM INPUT FRAME ]
          │                                        │
          ▼                                        ▼
   ( NLTK POS Tagger )                    ( MediaPipe Holistic )
          │                                        │
   ( Lemmatizer (WordNet) )                        ▼
          │                            [ Extract Core Keypoints ]
   ( ASL Grammar Resolver )               • 11 Pose Coordinates
   - Time-Topic-Comment-Wh                • 21 Left Hand Coordinates
          │                               • 21 Right Hand Coordinates
          ▼                                        │
   [ Mapping Dictionary ]                          ▼
   - WLASL Video Database                 [ Robust Scaling (IQR) ]
          │                                        │
          ▼                                        ▼
 ┌──────────────────┐                     [ Hybrid Deep Network ]
 │ Next.js Sequence │                     • Conv1D Pathway
 │   Video Player   │                     • Bi-LSTM Sequential Pathway
 └──────────────────┘                     • Multi-Head Self-Attention
                                                   │
                                                   ▼
                                          [ Softmax Classification ]
