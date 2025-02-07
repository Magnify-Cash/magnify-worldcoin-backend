import { Buffer } from 'buffer/index.js';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { worldchain } from 'viem/chains';
import { type ISuccessResult } from '@worldcoin/idkit';
import { Bytes, Hex, Hash } from 'ox';

// Define the comprehensive set of allowed claim actions
type ClaimAction =
	| 'mint-orb-verified-nft'
	| 'mint-passport-verified-nft'
	| 'mint-device-verified-nft'
	| 'upgrade-orb-verified-nft'
	| 'upgrade-passport-verified-nft'
	| 'upgrade-device-verified-nft';

// Structured request body with optional tokenId for upgrades
interface RequestBody {
	proof: ISuccessResult; // World ID proof data
	signal: string; // Unique identifier for the verification
	action: ClaimAction; // Specific claim/upgrade action
	nftInfo?: {
		tokenId: bigint | null;
		tier: any;
	};
}

// Environment variables required for blockchain interactions
interface Env {
	PRIVATE_KEY: string; // Wallet private key for transactions
	WORLD_COIN_APP_ID: string; // World ID verification app identifier
}

// Mapping of claim actions to specific tier IDs
// Tiers represent different levels of NFT privileges or characteristics
const ACTION_TO_TIER: Record<ClaimAction, number> = {
	'mint-device-verified-nft': 1,
	'upgrade-device-verified-nft': 1,
	'mint-passport-verified-nft': 2,
	'upgrade-passport-verified-nft': 2,
	'mint-orb-verified-nft': 3,
	'upgrade-orb-verified-nft': 3,
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Standard CORS and response headers
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Content-Type': 'application/json',
		};

		try {
			// Handle preflight CORS requests
			if (request.method === 'OPTIONS') {
				return new Response(null, { headers });
			}

			// Ensure only POST requests are processed
			if (request.method !== 'POST') {
				return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
			}

			// Parse incoming request body
			const rawBody = await request.text();
			let body: RequestBody;
			try {
				body = JSON.parse(rawBody);
			} catch (e) {
				return new Response(
					JSON.stringify({
						error: 'Invalid JSON',
						details: e instanceof Error ? e.message : 'Unknown parsing error',
					}),
					{ status: 400, headers },
				);
			}

			// Validate required parameters
			const missingParams: string[] = [];
			if (!body.proof) missingParams.push('proof');
			if (!body.signal) missingParams.push('signal');
			if (!body.action) missingParams.push('action');

			// Additional validation for upgrade actions
			if (body.action.startsWith('upgrade') && !body.nftInfo) {
				missingParams.push('nftInfo');
			}

			if (missingParams.length > 0) {
				return new Response(
					JSON.stringify({
						error: 'Missing required parameters',
						missingParams,
					}),
					{ status: 400, headers },
				);
			}

			// Verify World ID proof with external service
			const verifyResponse = await fetch('https://developer.worldcoin.org/api/v2/verify/app_5d33ab69e404d358e7fde190d5fb7241', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				},
				body: JSON.stringify({
					...body.proof,
					action: body.action,
					// Hash the signal for secure verification
					signal_hash: Hash.keccak256(Buffer.from(body.signal ?? ''), { as: 'Hex' }),
				}),
			});

			// Reject if World ID verification fails
			if (!verifyResponse.ok) {
				const error = await verifyResponse.text();
				return new Response(
					JSON.stringify({
						error: 'World ID verification failed',
						details: error,
					}),
					{ status: 400, headers },
				);
			}

			// Prepare blockchain wallet and client
			const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);
			const client = createWalletClient({
				account,
				chain: worldchain,
				transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
			});

			// Determine tier based on claim action
			const tier = ACTION_TO_TIER[body.action];
			const nftContractAddress = '0x4E52d9e8d2F70aD1805084BA4fa849dC991E7c88' as `0x${string}`;

			// Dynamically select mint or upgrade function
			const hash = await client.writeContract({
				address: nftContractAddress,
				abi: [
					body.action.startsWith('mint')
						? {
								name: 'mintNFT',
								type: 'function',
								stateMutability: 'nonpayable',
								inputs: [
									{ name: 'to', type: 'address' },
									{ name: 'tierId', type: 'uint256' },
								],
								outputs: [],
							}
						: {
								name: 'upgradeNFT',
								type: 'function',
								stateMutability: 'nonpayable',
								inputs: [
									{ name: 'tokenId', type: 'uint256' },
									{ name: 'newTierId', type: 'uint256' },
								],
								outputs: [],
							},
				],
				functionName: body.action.startsWith('mint') ? 'mintNFT' : 'upgradeNFT',
				args: body.action.startsWith('mint')
					? [body.signal as `0x${string}`, BigInt(tier)] // Mint
					: [BigInt(body.nftInfo?.tokenId!), BigInt(tier)], // Upgrade
			});

			// Return successful transaction details
			return new Response(
				JSON.stringify({
					success: true,
					transaction: hash,
					tier,
					action: body.action,
				}),
				{ status: 200, headers },
			);
		} catch (error) {
			// Catch and report any unexpected errors
			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				}),
				{ status: 500, headers },
			);
		}
	},
};
