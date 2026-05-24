#!/bin/bash

mkdir -p $HOME/data/db $HOME/logs

echo "Starting MongoDB..."
mongod --dbpath=$HOME/data/db --bind_ip=127.0.0.1 --port=27017 --noauth > $HOME/logs/mongod.log 2>&1 &

sleep 5

echo "MongoDB started. Starting application..."
npm run dev
