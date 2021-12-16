#!/bin/sh

# Change to the correct directory
cd /usr/src

# Run hardhat node in the background
nohup npx hardhat node >/dev/null 2>&1 &

# deploy smart contract
npx hardhat --network localhost run scripts/deploy.ts

# runs the hardhat console
npx hardhat --network localhost console