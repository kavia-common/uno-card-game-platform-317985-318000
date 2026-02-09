#!/bin/bash
cd /home/kavia/workspace/code-generation/uno-card-game-platform-317985-318000/uno_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

