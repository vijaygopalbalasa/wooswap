#!/bin/bash

# WooSwap Deployment Script for Monad Testnet
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying WooSwap to Monad Testnet..."

# Check environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$MONAD_RPC" ]; then
    echo "❌ Error: MONAD_RPC not set in .env"
    exit 1
fi

# Create deployments directory
mkdir -p deployments

# Load environment variables
source .env

echo "📋 Deployment Configuration:"
echo "Chain ID: 10143 (Monad Testnet)"
echo "RPC: $MONAD_RPC"
echo "Gas Price: 50 gwei"
echo ""

# Deploy contracts
echo "🔨 Running deployment script..."
forge script packages/foundry/script/DeployWoo.s.sol:DeployWoo \
    --rpc-url $MONAD_RPC \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --verifier sourcify \
    --verifier-url https://sourcify-api-monad.blockvision.org \
    --gas-price 50000000000

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Check deployments/monad-testnet.json for contract addresses"
echo "2. Update frontend contract addresses in packages/nextjs/components/WooSwap.tsx"
echo "3. Update indexer config.yaml with deployed addresses"
echo "4. Start the frontend: cd packages/nextjs && yarn dev"
echo "5. Start the indexer: cd indexer && docker-compose up -d"
echo ""
echo "🎮 Ready to Woo! Visit https://testnet.monadexplorer.com to view your contracts"