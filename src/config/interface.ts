export interface Env {
	PRIVATE_KEY: string; // Wallet private key for transactions
	WORLD_COIN_APP_ID: string; // World ID verification app identifier
	SUPABASE_URL: string; // Supabase URL for database interactions
	SUPABASE_SERVICE_ROLE_KEY: string; // Supabase service role key for authentication
	WORLDSCAN_API_KEY: string; // Worldscan API key
	WORLDCOIN_API_KEY: string; // Worldcoin API key
	DATABASE_URL: string;
	NODE_ENV: string;
	JWT_SECRET: string; //
}

export interface WorldScanTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    from: string;
    contractAddress: string;
    to: string;
    value: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    input: string;
    confirmations: string;
  }
  
export interface FormattedTransaction {
    transactionHash: string;
    blockNumber: string;
    from: string;
    to: string;
    amount: string;
    timestamp: string;
    status: "received" | "repaid";
  }

export interface UserResult {
    email: string;
    password_hash: string;
    username: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    name?: string;
}

export interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}