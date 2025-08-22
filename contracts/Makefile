# Makefile for YieldOptimizer deployments
# Industry standard approach for managing different environments

# Default Anvil private key (first account)
DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# RPC URLs
LOCAL_RPC := http://localhost:8545
FUJI_RPC := https://api.avax-test.network/ext/bc/C/rpc
MAINNET_RPC := https://api.avax.network/ext/bc/C/rpc

# Verification
ETHERSCAN_API_KEY := $(SNOWTRACE_API_KEY)

.PHONY: help deploy-local deploy-fuji deploy-mainnet test clean

help: ## Show this help message
	@echo "YieldOptimizer Deployment Commands"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Local deployment (uses default Anvil key, preserves Fuji chain ID 43113)
deploy-local: ## Deploy to local Anvil instance
	@echo "🔧 Deploying to local Anvil (preserving Fuji chain ID 43113)..."
	@if ! curl -s $(LOCAL_RPC) -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null; then \
		echo "❌ Anvil not running. Start with: make start-anvil"; \
		exit 1; \
	fi
	FOUNDRY_PROFILE=local IS_FORK=true forge script script/Deploy.s.sol \
		--rpc-url $(LOCAL_RPC) \
		--private-key $(DEFAULT_ANVIL_KEY) \
		--broadcast \
		-vvvv

# Local deployment without fork (pure local)
deploy-local-pure: ## Deploy to local Anvil without fork
	@echo "🔧 Deploying to pure local Anvil..."
	FOUNDRY_PROFILE=local IS_FORK=false forge script script/Deploy.s.sol \
		--rpc-url $(LOCAL_RPC) \
		--private-key $(DEFAULT_ANVIL_KEY) \
		--broadcast \
		-vvvv

# Fuji testnet deployment (requires PRIVATE_KEY env var)
deploy-fuji: ## Deploy to Avalanche Fuji testnet
	@echo "🧪 Deploying to Fuji testnet..."
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "❌ PRIVATE_KEY environment variable is required for Fuji deployment"; \
		echo "Usage: PRIVATE_KEY=0x... make deploy-fuji"; \
		exit 1; \
	fi
	FOUNDRY_PROFILE=fuji forge script script/Deploy.s.sol \
		--rpc-url $(FUJI_RPC) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv

# Mainnet deployment (requires PRIVATE_KEY env var and confirmation)
deploy-mainnet: ## Deploy to Avalanche mainnet (requires confirmation)
	@echo "🚨 MAINNET DEPLOYMENT 🚨"
	@echo "This will deploy to Avalanche Mainnet with real funds!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "❌ PRIVATE_KEY environment variable is required for mainnet deployment"; \
		echo "Usage: PRIVATE_KEY=0x... make deploy-mainnet"; \
		exit 1; \
	fi
	FOUNDRY_PROFILE=mainnet forge script script/Deploy.s.sol \
		--rpc-url $(MAINNET_RPC) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv

# Test commands
test: ## Run all tests
	forge test -vvv

test-local: ## Run tests with local profile
	FOUNDRY_PROFILE=local forge test -vvv

test-fork: ## Run tests against forked network
	forge test --fork-url $(FUJI_RPC) -vvv

# Utility commands
clean: ## Clean build artifacts
	forge clean

compile: ## Compile contracts
	forge build

start-anvil: ## Start Anvil with Fuji fork (preserves original chain ID)
	@echo "🔧 Starting Anvil with Fuji fork (chain ID 43113)..."
	anvil --fork-url $(FUJI_RPC)

check-balance: ## Check deployer balance on different networks
	@echo "Checking balances..."
	@echo "Local Anvil (first account):"
	@cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url $(LOCAL_RPC) 2>/dev/null || echo "  ❌ Anvil not running"
	@if [ ! -z "$(PRIVATE_KEY)" ]; then \
		echo "Fuji testnet:"; \
		cast balance $$(cast wallet address $(PRIVATE_KEY)) --rpc-url $(FUJI_RPC); \
		echo "Mainnet:"; \
		cast balance $$(cast wallet address $(PRIVATE_KEY)) --rpc-url $(MAINNET_RPC); \
	else \
		echo "Set PRIVATE_KEY to check testnet/mainnet balances"; \
	fi

# Development helpers
watch: ## Watch for changes and recompile
	forge build --watch

gas-report: ## Generate gas report
	forge test --gas-report

coverage: ## Generate coverage report
	forge coverage
