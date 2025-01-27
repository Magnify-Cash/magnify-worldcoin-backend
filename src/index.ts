import { Buffer } from 'buffer/index.js';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { worldchain } from 'viem/chains';
import { type ISuccessResult } from '@worldcoin/idkit';
import { Bytes, Hex, Hash } from 'ox';

interface RequestBody {
	proof: ISuccessResult;
	signal: string;
	action: string;
}

interface Env {
	PRIVATE_KEY: string;
}

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
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Content-Type': 'application/json',
		};

		try {
			// Parsing
			if (request.method === 'OPTIONS') {
				return new Response(null, { headers });
			}
			if (request.method !== 'POST') {
				return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
			}
			const rawBody = await request.text();
			let body;
			try {
				body = JSON.parse(rawBody) as RequestBody;
			} catch (e) {
				return new Response(
					JSON.stringify({
						error: 'Invalid JSON',
						message: 'Please provide valid JSON in the request body',
						details: e instanceof Error ? e.message : 'Unknown parsing error',
						receivedBody: rawBody,
					}),
					{ status: 400, headers },
				);
			}

			// Validation
			const missingParams = [];
			if (!body.proof) missingParams.push('proof');
			if (!body.signal) missingParams.push('signal');
			if (!body.action) missingParams.push('action');
			console.log('MISSING PARAMS', missingParams);

			// Verify World ID proof
			console.log('Attempting World ID verification...', body.proof, body.action, body.signal);
			console.log(
				JSON.stringify({
					...body.proof,
					action: body.action,
					signal: body.signal ?? '',
				}),
			);
			const response = await fetch('https://developer.worldcoin.org/api/v2/verify/app_cfd0a40d70419e3675be53a0aa9b7e10', {
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
			if (!response.ok) {
				const error = await response.text();
				console.error('World ID verification failed:', error);
				return new Response(JSON.stringify({ error: 'World ID verification failed', details: error }), { status: 400, headers });
			}
			console.log('World ID verification successful');

			// NFT Minting
			const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);
			const client = createWalletClient({
				account,
				chain: worldchain,
				transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
			});
			const tier = body.action === 'mint-device-verified-nft' ? 1 : 3;
			console.log('Attempting to mint NFT with tier:', tier);
			const hash = await client.writeContract({
				address: '0x4E52d9e8d2F70aD1805084BA4fa849dC991E7c88' as `0x${string}`,
				abi: [
					{
						name: 'mintNFT',
						type: 'function',
						stateMutability: 'nonpayable',
						inputs: [
							{ name: 'to', type: 'address' },
							{ name: 'tierId', type: 'uint256' },
						],
						outputs: [],
					},
				],
				functionName: 'mintNFT',
				args: [body.signal as `0x${string}`, BigInt(tier)],
			});
			console.log('NFT minted successfully, hash:', hash);
			return new Response(
				JSON.stringify({
					success: true,
					transaction: hash,
					tier: tier,
				}),
				{ status: 200, headers },
			);
		} catch (error) {
			// General Error
			console.error('General error:', error);
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
