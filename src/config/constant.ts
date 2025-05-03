export const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Content-Type': 'application/json',
  };

export const USDC_ADDRESS = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1"
export const V1_MAGNIFY_CONTRACT_ADDRESS = "0x4E52d9e8d2F70aD1805084BA4fa849dC991E7c88"
export const V2_STAGING_CONTRACT_ADDRESS = "0x93dbB2d447F0086aF60B2becc66598fe3D9135A1"

export const WORLDSCAN_API_BASE_URL = "https://api.worldscan.org"
export const WORLDSCAN_PATH = {
	api: "/api",
	notification: "https://developer.worldcoin.org/api/v2/minikit/send-notification"
}
// Default QuickNode RPC URL for World Chain mainnet
// This will be used as a fallback if the environment variable is not set
export const WORLDCHAIN_RPC_URL = "https://stylish-blue-layer.worldchain-mainnet.quiknode.pro/d9686072665889b46ddc3132361dfd93bdaef92f/"
export const WORLDCHAIN_RPC_URL_V2 = "https://misty-bold-sky.worldchain-mainnet.quiknode.pro/235d010fc088f8547cd7a07b1cb648c40438c0a6/"  //"https://chaotic-fabled-water.worldchain-sepolia.quiknode.pro/3f033f9e1b6829b9b352bed07914e122c10ec1d4/" 
export const WORLDCHAIN_RPC_URL_V3 = "https://alien-frosty-snowflake.worldchain-mainnet.quiknode.pro/3232f588cd316dd1f32d9e059004d8459f972dcb/" //"https://worldchain-sepolia.g.alchemy.com/v2/Cj_65mRSyh2uxEc9RCI6JhMQSOVwz56m"
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

export const ETHERSCAN_API_KEY = "WEI3K4JI767C3UB17K6138HMY1J7W1XAGR"

export const DEFAULTS_CONTRACT = "0x9F043F500913a83d62Eb0A4e321f062a484baBbA"

// Consolidated contract addresses
export const CONTRACTS = {
  legacyRepay: "0x9F043F500913a83d62Eb0A4e321f062a484baBbA",
  soulbound: "0x2703CbD5E7720b65352B1Dd17a3d8df77CfECd08",
  beacon: "0xAe4Dd5A98Cb3ca25D092402e826Ba5b33b846F30",
  v1: "0x4E52d9e8d2F70aD1805084BA4fa849dC991E7c88",
  v2: "0x93dbB2d447F0086aF60B2becc66598fe3D9135A1",
};