#!/bin/bash

# Navigate to the working directory
cd /shared/server

chmod +x ffmpeg

yes y | tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 --text "Models have been downloaded" --out_path "/shared/started.wav" --speaker_wav "/shared/voices/Female-1.wav" --language_idx en --use_cuda true

# Install dependencies
npm install

# Start the application
npm start

