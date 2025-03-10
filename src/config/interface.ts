export interface Env {
	PRIVATE_KEY: string; // Wallet private key for transactions
	WORLD_COIN_APP_ID: string; // World ID verification app identifier
	WORLDSCAN_API_KEY: string; // Worldscan API key
	WORLDCOIN_API_KEY: string; // Worldcoin API key
	DATABASE_URL: string;
	JWT_SECRET: string; //
    V2_MAGNIFY_CONTRACT_ADDRESS: string;
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

export type ClaimAction =
	| 'mint-orb-verified-nft'
	| 'mint-passport-verified-nft'
	| 'mint-device-verified-nft'
	| 'upgrade-orb-verified-nft'
	| 'upgrade-passport-verified-nft'
	| 'upgrade-device-verified-nft';

export const ACTION_TO_TIER: Record<ClaimAction, number> = {
    'mint-device-verified-nft': 1,
    'upgrade-device-verified-nft': 1,
    'mint-passport-verified-nft': 2,
    'upgrade-passport-verified-nft': 2,
    'mint-orb-verified-nft': 3,
    'upgrade-orb-verified-nft': 3,
    };