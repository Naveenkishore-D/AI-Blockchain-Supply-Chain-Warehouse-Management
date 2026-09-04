# Project Folder Structure

This document outlines the professional folder structure designed for the Nexus Supply Chain Management System. The architecture separates concerns across different domains, enabling scalable development, clear boundaries, and easier maintenance.

## Directory Layout

### \`/frontend\`
Contains the user interface, built with React and Vite.
- \`src/components/\`: Reusable UI components (buttons, modals, forms).
- \`src/pages/\`: High-level views (Dashboard, Directory, Inventory, Chat).
- \`src/services/\`: API client integrations and external service wrappers.
- \`src/store/\`: State management (Redux, Zustand, or Context).

### \`/backend\`
The core Node.js/Express backend server that orchestrates the supply chain logic.
- \`routes/\`: API route definitions and endpoint mapping.
- \`controllers/\`: Request handling and business logic orchestration.
- \`services/\`: Reusable business logic, third-party integrations.
- \`models/\`: Data models and schemas.
- \`config/\`: Environment configurations.

### \`/blockchain\`
Contains Smart Contracts and Web3 integration for the immutable ledger.
- \`contracts/\`: Solidity (.sol) smart contracts for tracking shipments and audits.
- \`scripts/\`: Deployment scripts for migrating contracts to the network.
- \`tests/\`: Smart contract test suites (Hardhat/Foundry).

### \`/ai-agent\`
Houses the Artificial Intelligence logic, powered by LLMs (e.g. Gemini).
- \`services/\`: Integration with AI models.
- \`prompts/\`: System prompts, few-shot examples, and context templates.
- \`utils/\`: Formatting, parsing, and context management utilities.

### \`/db\`
Database management, scripts, and schemas.
- \`migrations/\`: Version-controlled database migration scripts.
- \`seeds/\`: Initial data population scripts for testing and staging.
- \`scripts/\`: Maintenance and backup utilities.

### \`/docker\`
Docker configuration files for containerization.
- Holds \`Dockerfile\` components, \`docker-compose\` files for local dev, and environment-specific configs.

### \`/docs\`
System documentation.
- \`api/\`: OpenAPI/Swagger specifications for backend endpoints.
- \`architecture/\`: System design diagrams, decision records (ADRs).

### \`/deploy\`
Infrastructure as Code (IaC) and CI/CD deployment configurations.
- \`k8s/\`: Kubernetes manifests (Deployments, Services, Ingress).
- \`terraform/\`: Cloud infrastructure provisioning scripts.
- \`scripts/\`: CI/CD pipeline automation scripts.
