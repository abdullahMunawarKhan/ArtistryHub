#!/bin/bash
if [ "$VERCEL_GIT_BRANCH" != "main" ]; then
  echo "Not main branch → skipping build"
  exit 0
fi
