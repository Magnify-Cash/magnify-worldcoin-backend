# Magnify Worldcoin Backend Migration Guide

## Overview

This document outlines the migration of the Magnify Worldcoin backend to use:
- Supabase for database storage
- QuickNode for World Chain RPC access
- A new health endpoint to verify connectivity

## Environment Variables

Add the following environment variables to your Cloudflare Workers or local development environment:

```
SUPABASE_URL=https://kontavvojkeleracsucu.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbnRhdnZvamtlbGVyYWNzdWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI0MTc0NiwiZXhwIjoyMDYxODE3NzQ2fQ.J1xhLj6FXBIz0cAmvwjtcQ9Abzwt0YIIUSvq3YTOclc
QUICKNODE_RPC_URL=https://stylish-blue-layer.worldchain-mainnet.quiknode.pro/d9686072665889b46ddc3132361dfd93bdaef92f/
JWT_SECRET=xqAc0uTE+wlVwqvWAS3xUNqmvVZf+oJqE3EBC1CJxS9dAWt+lwoCpwyDsJOc89CBctmESberODQgJB2WnIiu1w==
```

## Implementation Steps

### 1. Create Config Module

Create a new file at `src/config/index.ts`:

```typescript
import { Env } from './interface';

export const getConfig = (env: Env) => {
  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_KEY,
    quickNodeUrl: env.QUICKNODE_RPC_URL,
    jwtSecret: env.JWT_SECRET,
  };
};

export default getConfig;
```

### 2. Update Environment Interface

Modify `src/config/interface.ts` to add the new environment variables:

```typescript
export interface Env {
  PRIVATE_KEY: string; // Wallet private key for transactions
  WORLD_COIN_APP_ID: string; // World ID verification app identifier
  WORLDSCAN_API_KEY: string; // Worldscan API key
  WORLDCOIN_API_KEY: string; // Worldcoin API key
  DATABASE_URL: string;
  JWT_SECRET: string;
  V2_MAGNIFY_CONTRACT_ADDRESS: string;
  V3_MAGNIFY_CONTRACT_ADDRESS: string;
  SOULBOUND_NFT_CONTRACT_ADDRESS: string;
  // New environment variables
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  QUICKNODE_RPC_URL: string;
}
```

### 3. Update RPC URL Constant

In `src/config/constant.ts`, update the RPC URL:

```typescript
export const WORLDCHAIN_RPC_URL = "https://stylish-blue-layer.worldchain-mainnet.quiknode.pro/d9686072665889b46ddc3132361dfd93bdaef92f/";
```

### 4. Update Database Connection

Modify `src/database/init.ts` to use Supabase:

```typescript
import { Sequelize } from "sequelize";
import pg from 'pg';
import { Env } from '../config/interface';
import { getConfig } from '../config';

export async function getConnection(env: Env): Promise<Sequelize> {
  const config = getConfig(env);
  
  // Use Supabase URL with credentials instead of DATABASE_URL
  const databaseUrl = env.DATABASE_URL || `${config.supabaseUrl}/postgres?apikey=${config.supabaseKey}`;
  
  console.log('Connecting to database...');
  
  // Create a new connection for each request
  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg, // Use the statically imported pg module
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // Add statement timeout to prevent hanging queries
      statement_timeout: 10000, // 10 seconds
      query_timeout: 10000, // 10 seconds
      idle_in_transaction_session_timeout: 10000, // 10 seconds
    },
    // Important: Don't pool connections in serverless
    pool: {
      max: 1, // Only use one connection per request
      min: 0,
      idle: 5000, // Release idle connections quickly
      acquire: 10000, // Don't wait too long to acquire a connection
      evict: 1000, // Check for idle connections more frequently
    },
    // Set query timeout
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 2, // Don't retry too many times
    }
  });
  
  try {
    // Set a timeout for the authentication to prevent hanging
    const authPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Authentication timeout')), 5000);
    });
    
    // Race between authentication and timeout
    await Promise.race([authPromise, timeoutPromise]);
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    
    // Make sure to close the connection on error
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
    
    throw error;
  }
}

// Helper to safely close a connection
export async function closeConnection(connection: Sequelize | null): Promise<void> {
  if (connection) {
    try {
      await connection.close();
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
}

export default getConnection;
```

### 5. Add Health Endpoint

In `src/index.ts`, add a new route in the switch statement:

```typescript
case '/health':
  try {
    // Check database connection
    const dbConnection = await getConnection(env);
    await dbConnection.authenticate();
    
    // Check RPC connection
    const client = await initPublicClient(env, env.QUICKNODE_RPC_URL || WORLDCHAIN_RPC_URL);
    const blockNumber = await client.getBlockNumber();
    
    await closeConnection(dbConnection);
    
    return apiResponse(200, 'Service is healthy', {
      database: 'connected',
      rpc: `connected (block #${blockNumber})`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return errorResponse(500, 'Service is not healthy', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
```

### 6. Update Contract Utilities

Modify any files in `src/utils` that initialize RPC connections to use the environment variable if available:

```typescript
const rpcUrl = env.QUICKNODE_RPC_URL || WORLDCHAIN_RPC_URL;
```

### 7. Set Environment Variables in Cloudflare

Run the following commands to set the secrets for your Cloudflare Worker:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put QUICKNODE_RPC_URL
wrangler secret put JWT_SECRET
```

## Testing

### Local Testing

1. Start the local development server:
   ```
   npm run dev
   ```

2. Test the health endpoint:
   ```
   curl http://localhost:8787/health
   ```

3. Expected response:
   ```json
   {
     "status": "success",
     "message": "Service is healthy",
     "data": {
       "database": "connected",
       "rpc": "connected (block #12345678)",
       "timestamp": "2025-05-03T04:17:04.000Z"
     }
   }
   ```

### Deployment Testing

1. Deploy to Cloudflare Workers:
   ```
   npm run deploy
   ```

2. Test the health endpoint on the deployed Worker:
   ```
   curl https://magnify-worldcoin-backend.yourusername.workers.dev/health
   ```

## Troubleshooting

### Database Connection Issues

- Verify the Supabase URL and key are correct
- Check that the database exists in Supabase
- Ensure SSL is properly configured

### RPC Connection Issues

- Verify the QuickNode RPC URL is correct 
- Check that your subscription is active
- Ensure the URL includes the full path with the API key

### Deployment Issues

- Check that all environment variables are properly set in Cloudflare
- Verify that wrangler.toml has the correct configuration
- Look at Cloudflare Workers logs for specific error messages
