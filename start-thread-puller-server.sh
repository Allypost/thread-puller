#!/bin/bash

# Resolve script location
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ ${SOURCE} != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

# Name of the master server file
scriptName="threadpuller-web.config.js"
# Get absolute path to script
scriptLoc="$DIR/$scriptName"

# Move into script dir so that node can read relative files
cd ${DIR}

# Start monitoring process
pm2 start ${scriptLoc}