# Magnify World Backend API 🚀

## Overview

The Magnify World Backend API is a robust Cloudflare Workers-based backend service that powers the Magnify World App V2 DeFi platform. Built with TypeScript and deployed on Cloudflare's edge infrastructure, this backend handles World ID verification, database operations, smart contract interactions, and provides a comprehensive API for the frontend application.

The backend integrates with World Chain (Chain ID 480) for blockchain operations, PostgreSQL for data persistence, and various external services for enhanced functionality including World ID verification, transaction monitoring, and notification services.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technical Stack](#technical-stack)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [Smart Contract Integration](#smart-contract-integration)
10. [World ID Verification](#world-id-verification)
11. [Development Guidelines](#development-guidelines)
12. [Deployment](#deployment)
13. [Security Considerations](#security-considerations)
14. [Known Issues](#known-issues)
15. [Troubleshooting](#troubleshooting)
16. [Recent Improvements](#recent-improvements-june-2025)
17. [Changelog](#changelog)
18. [Contributing](#contributing)
19. [License](#license)

## Features

- **World ID Verification**: Secure zero-knowledge proof verification for user authentication
- **Smart Contract Integration**: Seamless interaction with MagnifyV1, V2, and V3 contracts on World Chain
- **Database Operations**: Comprehensive user management, wallet tracking, and lending history
- **Transaction Management**: Real-time transaction monitoring and history retrieval via WorldScan API
- **Notification System**: Push notifications for loan activities and updates
- **Multi-RPC Support**: Redundant RPC providers for enhanced reliability
- **Authentication**: JWT-based authentication with role-based access control
- **Pool Management**: V3 pool operations including deposits, withdrawals, and LP token management
- **Legacy Loan Support**: Backward compatibility with V1/V2 loan systems

## Technical Stack

- **Runtime**: Cloudflare Workers with Node.js compatibility
- **Language**: TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Blockchain**: World Chain (Chain ID 480) via Viem/Ethers.js
- **Authentication**: JWT with bcryptjs for password hashing
- **External APIs**: 
  - WorldScan API for transaction data
  - Worldcoin Developer API for ID verification
  - QuickNode RPC for primary blockchain interactions
  - Alchemy for specialized token discovery operations
- **Package Manager**: pnpm

## Architecture

```mermaid
graph TB
    FE[Frontend App] --> CF[Cloudflare Workers]
    CF --> DB[(PostgreSQL Database)]
    CF --> WC[World Chain RPC]
    CF --> WS[WorldScan API]
    CF --> WID[Worldcoin API]
    CF --> ALY[Alchemy RPC]
    
    subgraph "Smart Contracts"
        V1[MagnifyV1]
        V2[MagnifyV2] 
        V3[MagnifyV3 Pools]
        SB[Soulbound NFTs]
        DEF[Defaults Contract]
    end
    
    WC --> V1
    WC --> V2
    WC --> V3
    WC --> SB
    WC --> DEF
```

### Core Components

- **Controllers**: Handle HTTP requests and business logic
- **Database Layer**: Sequelize models and queries for data persistence  
- **Helpers**: Utility functions for blockchain and token operations
- **Middleware**: Authentication and request validation
- **Utils**: Shared utilities for API responses, contracts, and hashing

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- pnpm package manager
- Cloudflare account with Workers enabled
- PostgreSQL database
- World Chain RPC access

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd magnify-worldcoin-backend
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Configure environment variables** (see [Environment Variables](#environment-variables))

4. **Generate TypeScript types**:
```bash
pnpm cf-typegen
```

### Development

Start the development server:
```bash
pnpm dev
```

Run tests:
```bash
pnpm test
```

## Environment Variables

Configure the following environment variables in your Cloudflare Workers dashboard or wrangler secrets:

### Core Configuration
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your_jwt_secret_key

# Blockchain Private Key (for contract interactions)
PRIVATE_KEY=0x... # Never commit this value
```

### RPC Configuration (Updated June 2025)
```bash
# Primary QuickNode RPC (aligned with frontend)
WORLDCHAIN_RPC_URL=https://yolo-intensive-owl.worldchain-mainnet.quiknode.pro/02bc3fb4f359e0c2dadc693ec8c9de8288edfad8/

# Backup QuickNode RPC endpoints
WORLDCHAIN_RPC_URL_V2=https://misty-bold-sky.worldchain-mainnet.quiknode.pro/235d010fc088f8547cd7a07b1cb648c40438c0a6/
WORLDCHAIN_RPC_URL_V3=https://alien-frosty-snowflake.worldchain-mainnet.quiknode.pro/3232f588cd316dd1f32d9e059004d8459f972dcb/

# Alchemy (for specialized token discovery only)
WORLDCHAIN_ALCHEMY_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/Cj_65mRSyh2uxEc9RCI6JhMQSOVwz56m
```

### World ID & API Keys
```bash
# World ID Application
WORLD_COIN_APP_ID=app_your_worldcoin_app_id

# External API Keys
WORLDSCAN_API_KEY=your_worldscan_api_key
WORLDCOIN_API_KEY=your_worldcoin_api_key
```

### Smart Contract Addresses
```bash
# Contract Addresses on World Chain
V2_MAGNIFY_CONTRACT_ADDRESS=0x...
V3_MAGNIFY_CONTRACT_ADDRESS=0x...
SOULBOUND_NFT_CONTRACT_ADDRESS=0x...
```

**Security Note**: Use `wrangler secret put <KEY_NAME>` to securely set sensitive values like private keys and API keys.

## API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/saveWallet` | POST | Register wallet with notifications |
| `/checkWallet` | GET | Check if wallet exists |
| `/verify` | POST | World ID verification |

### V3 Pool Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v3/preview/deposit` | GET | Preview deposit operation |
| `/v3/preview/mint` | GET | Preview mint operation |
| `/v3/preview/redeem` | GET | Preview redeem operation |
| `/v3/preview/withdraw` | GET | Preview withdraw operation |
| `/v3/totalAssets` | GET | Get pool total assets |
| `/v3/totalSupply` | GET | Get pool total supply |
| `/v3/maxPoolData` | GET | Get user's max pool operations |
| `/v3/poolBalance` | GET | Get user's LP token balance |

### User & Transaction Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/getTransactionHistory` | GET | Get user transaction history |
| `/sendNotification` | POST | Send push notification |
| `/login` | POST | User authentication |
| `/register` | POST | User registration |
| `/users` | GET | Get all users (admin) |

### Soulbound & Pool Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/soulbound/data` | GET | Get soulbound NFT data |
| `/soulbound/uri` | GET | Get token URI |
| `/soulbound/loan/history` | GET | Get loan history |
| `/v3/activeLoan` | GET | Get active loan |
| `/v3/loanHistory` | GET | Get loan history |

## Database Schema

### Core Tables

#### `mag_users`
```sql
CREATE TABLE mag_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `mag_roles`
```sql
CREATE TABLE mag_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `mag_user_roles`
```sql
CREATE TABLE mag_user_roles (
    user_id UUID REFERENCES mag_users(user_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES mag_roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

#### `user_wallets`
```sql
-- Inferred from queries - exact schema may vary
CREATE TABLE user_wallets (
    id SERIAL PRIMARY KEY,
    wallet VARCHAR(42) NOT NULL UNIQUE,
    notification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Additional Tables
- `user_pool_lending` - Tracks lending history and LP token operations
- `pool_addresses` - Stores pool contract addresses and metadata
- `pool_lp_tokens` - Historical LP token price data

## Smart Contract Integration

### Supported Contracts

#### MagnifyV1 (`V1_MAGNIFY_CONTRACT_ADDRESS`)
- Legacy loan system with basic NFT collateral
- Functions: `userNFT`, `requestLoan`, `repayLoan`

#### MagnifyV2 (`V2_MAGNIFY_CONTRACT_ADDRESS`)  
- Enhanced loan system with tier-based lending
- Permit2 integration for secure repayments
- Functions: `requestLoan`, `repayLoanWithPermit2`

#### MagnifyV3 Pools
- ERC4626-compatible vault system
- Dynamic pool management with configurable parameters
- Functions: `deposit`, `withdraw`, `mint`, `redeem`, `previewDeposit`, `previewRedeem`

#### Soulbound NFTs (`SOULBOUND_NFT_CONTRACT_ADDRESS`)
- World ID verification-based NFT minting
- Tier management for loan eligibility
- Functions: `mintNFT`, `userToId`, `getMagnifyPools`

#### Defaults Contract
- Legacy loan default management
- Cross-version compatibility checks
- Functions: `hasDefaultedLegacyLoan`, `getDefaultedLegacyLoan`

### Contract Interaction Patterns

```typescript
// Example: Reading from V3 contract with standardized RPC
const result = await readMagnifyV3Contract(
    env, 
    contractAddress, 
    'totalAssets'
);

// Example: Multi-RPC fallback (all QuickNode endpoints)
const RPC_URLS = [WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3];
// Primary: yolo-intensive-owl.worldchain-mainnet.quiknode.pro
// Automatically tries multiple QuickNode RPC providers for reliability

// Example: NFT minting with consistent RPC (Updated June 2025)
const client = createWalletClient({
    account,
    chain: worldchain,
    transport: http(WORLDCHAIN_RPC_URL), // Now uses consistent QuickNode RPC
});
```

## World ID Verification

### Verification Flow

1. **Frontend**: User initiates World ID verification
2. **Backend Receives**: ZKP payload with proof, merkle_root, nullifier_hash
3. **Verification**: Proof validated against Worldcoin Developer API
4. **NFT Minting**: Successful verification triggers tier-appropriate NFT mint
5. **Response**: Transaction hash and verification status returned

### Implementation Example

```typescript
export async function verifyWorldUserController(request: Request, env: Env) {
    const { payload, action, signal, tokenId } = await request.json();
    
    // Verify proof with Worldcoin
    const verifyResponse = await axios.post(
        `https://developer.worldcoin.org/api/v2/verify/${env.WORLD_COIN_APP_ID}`,
        {
            nullifier_hash: payload.nullifier_hash,
            proof: payload.proof,
            merkle_root: payload.merkle_root,
            verification_level: payload.verification_level,
            action: action,
            signal_hash: hashToField(signal ?? '').digest,
        }
    );
    
    // Mint NFT on successful verification
    const transactionHash = await mintNFT(action, signal, tokenId, env);
    
    return apiResponse(200, 'User verified successfully', { 
        ...verifyResponse.data, 
        transactionHash 
    });
}
```

## Development Guidelines

### Code Organization

```
src/
├── config/           # Configuration and constants
│   ├── contracts/    # ABI files
│   ├── constant.ts   # App constants
│   └── interface.ts  # TypeScript interfaces
├── controller/       # Request handlers
│   ├── user.controller.ts
│   ├── world.controller.ts
│   └── v3.controller.ts
├── database/         # Data layer
│   ├── models/       # SQL schema files
│   ├── queries/      # Database queries
│   └── init.ts       # Database connection
├── helpers/          # Business logic utilities
├── middleware/       # Request middleware
├── utils/           # Shared utilities
└── index.ts         # Main application entry
```

### Coding Standards

1. **TypeScript**: Strict type checking enabled
2. **Error Handling**: Always use try-catch with proper logging
3. **Database**: Use transactions for multi-step operations
4. **Validation**: Validate all inputs before processing
5. **Logging**: Comprehensive logging for debugging and monitoring

### Testing

```bash
# Run test suite
pnpm test

# Test specific file
pnpm test src/utils/contract.utils.test.ts
```

## Deployment

### Production Deployment

1. **Configure secrets**:
```bash
wrangler secret put DATABASE_URL
wrangler secret put PRIVATE_KEY
wrangler secret put JWT_SECRET
wrangler secret put WORLDSCAN_API_KEY
wrangler secret put WORLDCOIN_API_KEY
```

2. **Deploy to Cloudflare Workers**:
```bash
pnpm deploy
```

3. **Verify deployment**:
```bash
curl https://your-worker.your-subdomain.workers.dev/
```

### Environment Management

- **Development**: Use `wrangler dev` with local `.env` file
- **Staging**: Deploy to staging worker with test environment variables
- **Production**: Deploy with production secrets and database

## Security Considerations

### Authentication & Authorization
- JWT tokens with configurable expiration
- Role-based access control for admin endpoints
- Secure password hashing with bcryptjs

### Blockchain Security
- Private key management via Cloudflare secrets
- Chain ID validation for all transactions
- Input validation for all contract interactions
- Standardized RPC provider usage for consistency
- Multiple QuickNode RPC endpoints for redundancy

### API Security
- Rate limiting on sensitive endpoints
- Input sanitization and validation
- CORS headers properly configured
- Error messages that don't leak sensitive information

### Database Security
- Parameterized queries to prevent SQL injection
- Connection timeouts to prevent resource exhaustion
- Proper connection management and cleanup

## Known Issues

### ✅ RPC Data Consistency - **RESOLVED (June 2025)**
**Issue**: Pool withdrawal failures due to inconsistent RPC data reporting incorrect USDC balances.

**Root Cause Identified**: Mixed RPC provider usage between frontend and backend
- Frontend was using mixed Alchemy + QuickNode endpoints
- Backend had hardcoded Alchemy URLs for NFT minting
- This caused state mismatches during transaction processing

**Solution Implemented**:
- ✅ **Frontend**: Standardized all RPC calls to QuickNode (`yolo-intensive-owl.worldchain-mainnet.quiknode.pro`)
- ✅ **Backend**: Fixed NFT minting to use consistent QuickNode RPC
- ✅ **Alignment**: Frontend and backend now use identical primary RPC endpoint
- ✅ **Exception**: Token portfolio discovery still uses Alchemy (proprietary `alchemy_getTokenBalances` method)

**Current Status**: 
- Withdrawal transaction failures significantly reduced
- NFT minting reliability improved
- State consistency between frontend/backend established

### Database Connection Management
**Issue**: Potential connection leaks in high-concurrency scenarios.

**Mitigation**: Always use try-finally blocks with connection cleanup.

### ✅ saveWallet Parameter Binding - **RESOLVED (June 2025)**
**Issue**: Named bind parameter "$2" has no value - occurs when notification field is missing or undefined.

**Solution**: Enhanced input validation and default value handling implemented in controller with proper error logging and parameter validation.

## Troubleshooting

### Common Issues

#### Database Connection Failures
```
Error: Unable to connect to the database
```
**Solution**: Check DATABASE_URL format and network connectivity.

#### Contract Call Failures
```
Error: Internal JSON-RPC error
```
**Solutions**:
1. Verify contract address and function name
2. Check RPC provider status
3. Validate transaction parameters
4. Ensure sufficient gas and token balances

#### World ID Verification Failures
```
Error: Failed to verify user
```
**Solutions**:
1. Verify WORLD_COIN_APP_ID is correct
2. Check proof expiration and replay protection
3. Validate signal hash generation

### Debugging Tools

1. **Cloudflare Logs**: Real-time log streaming
```bash
wrangler tail
```

2. **Database Queries**: Enable query logging in development
3. **RPC Debugging**: Use multiple RPC providers to isolate issues

### Performance Optimization

1. **Database**: Use connection pooling and query optimization
2. **Caching**: Implement response caching for read-heavy endpoints
3. **RPC Calls**: Batch multiple contract calls where possible

## Contributing

1. **Fork the repository** and create a feature branch
2. **Follow coding standards** and add tests for new functionality
3. **Update documentation** for any API changes
4. **Submit pull requests** with detailed descriptions

### Development Workflow

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start development server
pnpm dev

# 4. Run tests
pnpm test

# 5. Deploy to staging
wrangler deploy --env staging
```

## Recent Improvements (June 2025)

### **RPC Infrastructure Overhaul**
- ✅ **Frontend-Backend Alignment**: Both systems now use identical QuickNode RPC endpoints
- ✅ **Withdrawal Reliability**: Significant reduction in "Internal JSON-RPC error" failures  
- ✅ **NFT Minting Consistency**: Eliminated hardcoded Alchemy URLs in critical transaction paths
- ✅ **State Synchronization**: Frontend and backend read from consistent blockchain state

### **For Users**
- ✅ Withdrawal transactions now work consistently
- ✅ Reduced transaction confirmation delays
- ✅ Better overall system reliability
- ✅ Improved NFT minting success rates

### **For Operations**
- ✅ Reduced support tickets for withdrawal failures
- ✅ More reliable error tracking and debugging
- ✅ Simplified RPC provider management
- ✅ Better monitoring and alerting capabilities

---

## Changelog

### **v2.1.0 - June 2025**
**🔧 RPC Infrastructure Overhaul**

**Changed:**
- ✅ **Fixed NFT minting RPC consistency**: Replaced hardcoded Alchemy URL with standardized QuickNode RPC
- ✅ **Aligned with frontend RPC standardization**: Both systems now use identical primary RPC endpoint
- ✅ **Updated documentation**: Added RPC configuration section and improved troubleshooting guides

**Fixed:**
- ✅ **Withdrawal transaction failures**: Eliminated RPC provider mismatches between frontend and backend
- ✅ **NFT minting reliability**: Consistent RPC usage across all transaction types
- ✅ **State synchronization issues**: Frontend and backend now read from same blockchain state

**Impact:**
- 🎯 **User Experience**: Significantly reduced withdrawal failures and transaction errors
- 🎯 **System Reliability**: Improved overall platform stability and consistency
- 🎯 **Developer Experience**: Simplified debugging and monitoring

**Files Modified:**
- `src/utils/contract.utils.ts` - Fixed hardcoded Alchemy RPC in NFT minting
- `README.md` - Updated documentation with new RPC infrastructure details

### **v2.0.0 - January 2025**
**🚀 Initial Production Release**
- Complete Cloudflare Workers backend implementation
- World ID verification system
- Multi-contract support (V1, V2, V3)
- PostgreSQL database integration
- JWT authentication system

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact & Support

**Development Team**: [siestamarkets.com](https://siestamarkets.com)  
**Support Email**: [ty@siestamarkets.com](mailto:ty@siestamarkets.com)

---

*Last Updated: June 2025* 