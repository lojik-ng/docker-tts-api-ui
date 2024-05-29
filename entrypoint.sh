#!/bin/bash

# Navigate to the working directory
cd /shared/server

# Install dependencies
npm install

# Start the application
npm start

yes y | tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 --text "Hello" --out_path "/shared/output/hello.wav" --speaker_wav "/shared/voices/Female-1.wav" --language_idx en --use_cuda true -y
