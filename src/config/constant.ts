export const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Content-Type': 'application/json',
  };

export const USDC_ADDRESS = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1"
export const V1_MAGNIFY_CONTRACT_ADDRESS = "0x4E52d9e8d2F70aD1805084BA4fa849dC991E7c88"


export const WORLDSCAN_API_BASE_URL = "https://api.worldscan.org"
export const WORLDSCAN_PATH = {
	api: "/api",
	notification: "https://developer.worldcoin.org/api/v2/minikit/send-notification"
}

export const WORLDCHAIN_RPC_URL = "https://icy-greatest-dream.worldchain-mainnet.quiknode.pro/f465b27e9a8dbd90d16bfb3bca7b2193bc1dcfa8/"
export const WORLDCHAIN_ALCHEMY_RPC_URL = "https://worldchain-mainnet.g.alchemy.com/v2/Cj_65mRSyh2uxEc9RCI6JhMQSOVwz56m"

export const SALT_ROUNDS = 10;

export const TOKEN_METADATA = {
	WLD: {
		tokenAddress: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
		tokenName: "Worldcoin",
		tokenSymbol: "WLD",
		tokenDecimals: 18,
	},
	USDC: {
		tokenAddress: "0x79a02482a880bce3f13e09da970dc34db4cd24d1",
		tokenName: "Bridged USDC (world-chain-mainnet)",
		tokenSymbol: "USDC.e",
		tokenDecimals: 6,
	},
	ORO: {
		tokenAddress: "0xcd1e32b86953d79a6ac58e813d2ea7a1790cab63",
		tokenName: "ORO",
		tokenSymbol: "ORO",
		tokenDecimals: 18,
	}
}