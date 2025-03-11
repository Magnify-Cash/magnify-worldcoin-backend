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

// {
//     eventName: 'LoanRepaid',
//     args: {
//       tokenId: 648n,
//       repaymentAmount: 10150000n,
//       borrower: '0xd84989d655e0ECbAc5ad1F80557F1594A692Cf85'
//     },
//     address: '0x4e52d9e8d2f70ad1805084ba4fa849dc991e7c88',
//     blockHash: '0x3c0cec618e686b6ea0c25b1dfe080100fff784942812a734ddbcb65dfaa2fdd2',
//     blockNumber: 9095680n,
//     data: '0x00000000000000000000000000000000000000000000000000000000009ae070000000000000000000000000d84989d655e0ecbac5ad1f80557f1594a692cf85',
//     logIndex: 23,
//     removed: false,
//     topics: [
//       '0xd1ccc1c5fd5d69d83162252c3a24405040a797f39b7da75119292819eb352d79',
//       '0x0000000000000000000000000000000000000000000000000000000000000288'
//     ],
//     transactionHash: '0xdcd9693980396721b1f2f6f4476eee8f61b56ec19a3150801e05d47d28114ef5',
//     transactionIndex: 3
//   },

export interface LoanRepaid {
    eventName: string;
    args: {
        tokenId: string;
        repaymentAmount: string;
        borrower: string;
    },
    address: string;
    blockHash: string;
    blockNumber: string;
    data: string;
    logIndex: number;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: number;   
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