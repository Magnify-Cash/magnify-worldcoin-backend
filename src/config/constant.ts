export const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Content-Type': 'application/json',
  };

export const USDC_ADDRESS = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1"
export const V1_MAGNIFY_CONTRACT_ADDRESS = "0x4E52d9e8d2F70aD1805084BA4fa849dC991E7c88"
export const V2_STAGING_CONTRACT_ADDRESS = "0xF3b2F1Bdb5f622CB08171707673252C222734Ca3"


export const WORLDSCAN_API_BASE_URL = "https://api.worldscan.org"
export const WORLDSCAN_PATH = {
	api: "/api",
	notification: "https://developer.worldcoin.org/api/v2/minikit/send-notification"
}
//https://icy-greatest-dream.worldchain-mainnet.quiknode.pro/f465b27e9a8dbd90d16bfb3bca7b2193bc1dcfa8/
//https://worldchain-sepolia.gateway.tenderly.co
export const WORLDCHAIN_RPC_URL = "https://yolo-intensive-owl.worldchain-mainnet.quiknode.pro/02bc3fb4f359e0c2dadc693ec8c9de8288edfad8/"//"https://chaotic-fabled-water.worldchain-sepolia.quiknode.pro/3f033f9e1b6829b9b352bed07914e122c10ec1d4/"//"https://icy-greatest-dream.worldchain-mainnet.quiknode.pro/f465b27e9a8dbd90d16bfb3bca7b2193bc1dcfa8/"
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