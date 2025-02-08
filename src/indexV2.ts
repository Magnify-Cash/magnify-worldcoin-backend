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
	tokenId: string;
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

export interface HashFunctionOutput {
	hash: bigint;
	digest: `0x${string}`;
}
export function hashToField(input: Bytes.Bytes | string): HashFunctionOutput {
	if (Bytes.validate(input) || Hex.validate(input)) return hashEncodedBytes(input);
	return hashString(input);
}
function hashString(input: string): HashFunctionOutput {
	const bytesInput = Buffer.from(input);
	return hashEncodedBytes(bytesInput);
}
function hashEncodedBytes(input: Hex.Hex | Bytes.Bytes): HashFunctionOutput {
	const hash = BigInt(Hash.keccak256(input, { as: 'Hex' })) >> 8n;
	const rawDigest = hash.toString(16);
	return { hash, digest: `0x${rawDigest.padStart(64, '0')}` };
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log('Request received:', {
			method: request.method,
			url: request.url,
			headers: Object.fromEntries(request.headers.entries()),
		});

		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Content-Type': 'application/json',
		};

		try {
			if (request.method === 'OPTIONS') {
				console.log('Handling CORS preflight request');
				return new Response(null, { headers });
			}

			if (request.method !== 'POST') {
				console.log('Invalid method:', request.method);
				return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
			}

			// Parse request body with logging
			const rawBody = await request.text();
			console.log('Raw request body:', rawBody);

			let body: RequestBody;
			try {
				body = JSON.parse(rawBody);
				console.log('Parsed request body:', body);
			} catch (e) {
				console.error('JSON parsing error:', e);
				return new Response(
					JSON.stringify({
						error: 'Invalid JSON',
						details: e instanceof Error ? e.message : 'Unknown parsing error',
					}),
					{ status: 400, headers },
				);
			}

			// Validate parameters with logging
			const missingParams: string[] = [];
			if (!body.proof) missingParams.push('proof');
			if (!body.signal) missingParams.push('signal');
			if (!body.action) missingParams.push('action');
			if (body.action?.startsWith('upgrade') && !body.tokenId) {
				missingParams.push('tokenId');
			}

			console.log('Parameter validation:', {
				missingParams,
				hasProof: !!body.proof,
				hasSignal: !!body.signal,
				hasAction: !!body.action,
				action: body.action,
				tokenId: body.tokenId,
			});

			if (missingParams.length > 0) {
				console.log('Missing parameters:', missingParams);
				return new Response(
					JSON.stringify({
						error: 'Missing required parameters',
						missingParams,
					}),
					{ status: 400, headers },
				);
			}

			// World ID verification logging
			console.log('Preparing World ID verification request:', {
				action: body.action,
				signal: body.signal,
				signalHash: hashToField(body.signal ?? '').digest,
			});

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
					signal_hash: hashToField(body.signal ?? '').digest,
				}),
			});

			console.log('World ID verification response:', {
				status: verifyResponse.status,
				ok: verifyResponse.ok,
			});

			if (!verifyResponse.ok) {
				const error = await verifyResponse.text();
				console.error('World ID verification failed:', error);
				return new Response(
					JSON.stringify({
						error: 'World ID verification failed',
						details: error,
					}),
					{ status: 400, headers },
				);
			}

			// Blockchain interaction logging
			console.log('Setting up blockchain client with env vars present:', {
				hasPrivateKey: !!env.PRIVATE_KEY,
				hasAppId: !!env.WORLD_COIN_APP_ID,
			});

			const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);
			const client = createWalletClient({
				account,
				chain: worldchain,
				transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
			});

			const tier = ACTION_TO_TIER[body.action];
			const nftContractAddress = '0x4E52d9e8d2F70aD1805084BA4fa849dC991E7c88' as `0x${string}`;

			console.log('Preparing contract interaction:', {
				tier,
				contractAddress: nftContractAddress,
				isMint: body.action.startsWith('mint'),
				action: body.action,
			});

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
				args: body.action.startsWith('mint') ? [body.signal as `0x${string}`, BigInt(tier)] : [BigInt(body?.tokenId!), BigInt(tier)],
			});

			console.log('Contract interaction successful:', {
				transactionHash: hash,
				action: body.action,
				tier,
			});

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
			console.error('Unexpected error:', {
				error,
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});

			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
				}),
				{ status: 500, headers },
			);
		}
	},
};
