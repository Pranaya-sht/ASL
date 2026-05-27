# ASL
This is a comprehensive, production-ready README.md for your ASL project. It
details the architecture of your system, including the hybrid machine learning
model (CNN + BiLSTM + Multi-Head Attention), the rule-based English-to-ASL text
glossizer, and the Next.js 15 dashboard.

ASL Learn & Translation System

An interactive American Sign Language (ASL) learning and real-time translation
system. The platform is engineered with a hybrid deep learning model for
real-time webcam gesture translation, a rule-based English-to-ASL grammar
glossizer, and a Next.js 15 dashboard featuring gamified learning progression,
custom quizzes, and comprehensive analytics.

Key Features

1. Real-Time ASL Video Translation

  - Landmark Tracking: Tracks user movements using MediaPipe Holistic
    (specifically focusing on 11 pose points, 21 left hand points, and 21 right
    hand points).
  - Deep Learning Engine: Translates sequence streams of 30 frames into dynamic
    word classifications using a hybrid Conv1D + Bidirectional LSTM + Multi-Head
    Self-Attention model.
  - Performance Optimization: Runs feature scaling and normalizations based on
    training set IQR and medians to deliver resilient real-time predictions.

2. English-to-ASL Text Glossalizer

  - ASL Grammar Engine: Formulates written English phrases into ASL syntax order
    (TIME-TOPIC-COMMENT-WH) [4].
  - NLP Pipeline: Uses NLTK tokenizers and lemmatizers to resolve contractions,
    handle spatial index mappings (e.g., this, that), replace pronouns, and
    conceptually isolate instrumental phrases (e.g., with my hands).
  - Video Playback: Dynamically maps parsed tokens onto WLASL dataset video
    streams and plays back translation videos in sequence.

3. Gamified Interactive Study Sandbox

  - Dynamic Flashcards: Study vocabulary with interactive dual-sided cards (Word
    on front, ASL demonstration video on back). Supports bookmarking, learned
    flags, and user feedback (Likes/Dislikes).
  - Adaptive Quizzes: Test your knowledge in a 10-level progressive quiz system.
    Quizzes generate random distractors for video-based questions.
  - Daily Practice & Scheduler: Generates 5 adaptive daily practice cards based
    on your current level and tracks your daily consistency streak. Includes a
    study scheduler to build custom learning reminders.

4. Advanced Analytics & Visualized Progression

  - Interactive Skill Trees: Uses ReactFlow to generate interactive tree graphs
    mapping out your knowledge base of learned levels and concept tags.
  - Visual Assessment Radar: Includes radar charts measuring your strength in
    Knowledge, Practice, Accuracy, Satisfaction, Quizzes, Completion, and
    Engagement.
  - Consistency Heatmap: Visualizes daily platform activity over a 30-day
    period.

Repository Structure

pranaya-sht-asl/
├── backend/
│   ├── auth.py                  # JWT OAuth2 authentication flow
│   ├── database.py              # PostgreSQL engine and session setup
│   ├── models.py                # SQLAlchemy DB schema (Users, QuizResults, Practices, Flashcards)
│   ├── schemas.py               # Pydantic validation schemas
│   ├── main.py                  # FastAPI application entrypoint
│   ├── routers/
│   │   ├── users.py             # User profile, photo uploads, and prediction histories
│   │   ├── learn.py             # Progressive quizzes, flashcards, and advanced analytics
│   │   └── translator.py        # Real-time gesture prediction & text-to-gloss server
│   ├── translator/
│   │   ├── glossizer.py         # NLTK rule-based TIME-TOPIC-COMMENT-WH syntax converter
│   │   ├── improved_collection.py   # Dataset collection with spatial & temporal augmentations
│   │   ├── improved_self_collection.py # Real-time custom video webcam data recorder
│   │   ├── improved_training.py # Mixed-precision training for Hybrid Conv1D-BiLSTM-Attention network
│   │   └── improved_detection.py# Live camera execution & inference loop
│   └── learning_module/         # CNN-LSTM video model training files for WLASL
└── frontend1/frontend/
    ├── package.json             # Next.js 15 setup & Tailwind CSS v4 dependencies
    ├── src/
    │   ├── app/                 # Next.js App Router structure
    │   │   ├── predict/         # Camera capturing page with live prediction overlay
    │   │   ├── translator/      # Text-to-gloss conversion page with sequence player
    │   │   ├── study/           # Sandboxes: Quiz, Flashcard, DailyPractice, Reminders, Progress
    │   │   └── page.js          # Interactive landing page
    │   ├── components/          # Reusable visualization elements (ReactFlow Skill trees, Radar charts)
    │   └── lib/                 # Tailwind classes and utilities

 Technical Architecture

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

Deep Learning Model Specifications

The gesture recognition network merges spatial feature extraction with
sequential time series mapping:

  - Convolutional Pathway: Passes inputs into sequential 1D Convolution layers
    with spatial dropouts and max pooling, capturing immediate local frame
    movements.
  - Sequential Pathway: Processes historical keypoints through stacked
    Bidirectional Long Short-Term Memory (BiLSTM) layers.
  - Feature Fusion & Attention: Concatenates pathways and feeds them into a
    Multi-Head Self-Attention Block to emphasize key turning points in sign
    execution.
  - Classification: Conjoins Global Average Pooling and Global Max Pooling
    layers before directing outputs to fully connected dense layers with strict
    L_1/L_2 regularization.

Installation & Setup

Prerequisites

  - Python 3.10+
  - Node.js 18+
  - PostgreSQL Database

1. Backend Setup

1.  Navigate to the backend folder:
    cd backend
2.  Create and activate a virtual environment:
    python -m venv venv
    source venv/bin/activate  # On Windows use: venv\Scripts\activate
3.  Install the required dependencies:
    pip install -r requirements.txt
    Note: If requirements.txt is missing, manually install core requirements:
    pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-multipart python-jose passlib bcrypt tensorflow mediapipe opencv-python numpy scikit-learn nltk tqdm scipy joblib
4.  Configure your environment variables inside a .env file:
    DATABASE_URL=postgresql://username:password@localhost:5432/asldb
    SECRET_KEY=your_super_secret_jwt_key
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=50000
5.  Initialize your database and tables:
    python db_init.py
6.  Import the flashcards database (resolves URLs & downloads index mapping
    files):
    python import_flashcards.py
7.  Download NLTK dependencies:
    python -c "import nltk; nltk.download('punkt'); nltk.download('wordnet'); nltk.download('omw-1.4'); nltk.download('averaged_perceptron_tagger')"
8.  Start the FastAPI server:
    uvicorn main:app --reload

2. Frontend Setup

1.  Navigate to the frontend folder:
    cd frontend1/frontend
2.  Install the required npm packages:
    npm install
3.  Run the Next.js development server:
    npm run dev
4.  Open http://localhost:3000 in your browser.

Pipeline Workflows: Custom Data Collection & Training

The repository contains scripts that allow you to collect your own gesture
samples via a webcam and train a custom recognition model.

Collect Custom Gesture Data

Record gestures dynamically from your webcam to expand training samples.

cd backend/translator
python improved_self_collection.py

  - Answer if you are left-handed (it automatically mirrors joint orientations).
  - Follow the screen prompts. Press S to start/pause recording, D to discard,
    and Q to quit.

 Preprocess & Train the Model

Compile joint keypoints, apply spatial/temporal augmentations (speed variations,
reverse playback, coordinate translations, noise jittering), and train the
model:

python improved_training.py

This script will:

1.  Read coordinates from the MP_Data/ directories.
2.  Scale features using Robust Scaling, saving normalizations to
    train_median_reduced.npy and train_iqr_reduced.npy.
3.  Execute the training loop and export the best-performing model to
    best_asl_model_reduced.h5.

Security

  - Password Safety: Implements secure hashing algorithms with BCrypt via
    passlib.
  - REST Access Restrictions: Features standard JWT Token encryption using HS256
    signatures to safeguard private progression routes, user profiles, and
    camera prediction API posts.
  - Media Security: File uploads validate and sanitize image mime-types before
    writing local disk file trees.

.
