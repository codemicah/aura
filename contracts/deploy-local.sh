#!/bin/bash

# Check if Anvil is running
if ! lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo "Error: Anvil is not running on port 8545"
    echo "Please start Anvil first: anvil"
    exit 1
fi

# Deploy contract
echo "Deploying contract..."
DEPLOY_OUTPUT=$(IS_FORK=true forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast 2>&1)

# Extract deployed address
DEPLOYED_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "YieldOptimizer deployed at:" | sed -n 's/.*YieldOptimizer deployed at: \(0x[a-fA-F0-9]*\).*/\1/p' | head -1)

if [ -z "$DEPLOYED_ADDRESS" ]; then
    echo "Deployment failed"
    exit 1
fi

echo "Contract deployed at: $DEPLOYED_ADDRESS"

# Update deployed-addresses.json
cat > ../deployed-addresses.json << EOF
{
  "yieldOptimizer": "$DEPLOYED_ADDRESS"
}
EOF

echo "Updated deployed-addresses.json"