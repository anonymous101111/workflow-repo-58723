#!/bin/bash
cd /home/kavia/workspace/code-generation/workflow-repo-58723/reviserr_monolithic_spa
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

