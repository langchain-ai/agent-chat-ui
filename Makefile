.PHONY: dev run install clean help

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Check if dependencies are installed
NODE_MODULES := node_modules
PACKAGE_LOCK := pnpm-lock.yaml

help: ## Show this help message
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@pnpm install

$(NODE_MODULES): $(PACKAGE_LOCK)
	@$(MAKE) install

dev: $(NODE_MODULES) ## Start development server with hot reload
	@echo "$(GREEN)Starting development server...$(NC)"
	@pnpm dev

run: $(NODE_MODULES) ## Build and start production server
	@echo "$(GREEN)Building application...$(NC)"
	@pnpm build
	@echo "$(GREEN)Starting production server...$(NC)"
	@pnpm start

clean: ## Remove node_modules and build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf node_modules .next

.DEFAULT_GOAL := help
