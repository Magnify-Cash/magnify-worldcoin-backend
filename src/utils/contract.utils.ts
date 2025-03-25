import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Bytes, Hex, Hash } from 'ox';
import { ACTION_TO_TIER, Env, ClaimAction } from '../config/interface';
import { worldchain } from 'viem/chains';
import { V1_MAGNIFY_CONTRACT_ADDRESS, WORLDCHAIN_RPC_URL } from '../config/constant';
import axios from 'axios';
import httpCall from 'http';



export async function getContractAddress(env: Env) {
    const contractAddresses = [
        V1_MAGNIFY_CONTRACT_ADDRESS, 
        String(env.V2_MAGNIFY_CONTRACT_ADDRESS || '').trim()
      ].map(addr => addr.toLowerCase());
      return contractAddresses;
}


export async function mintNFT(action: ClaimAction, signal: `0x${string}`, tokenId: string, env: Env) {
    try {

        let privateKey = String(env.PRIVATE_KEY || '').trim();

        if (!privateKey) {
            throw new Error('PRIVATE_KEY is undefined or empty after sanitization');
        }

        if (!privateKey.startsWith('0x')) {
            privateKey = `0x${privateKey}`;
        }

        if (privateKey.length !== 66) {
            throw new Error(`Invalid PRIVATE_KEY length: expected 66 characters, got ${privateKey.length}`);
        }


        const account = privateKeyToAccount(privateKey as Hex.Hex);

        const client = createWalletClient({
            account,
            chain: worldchain,
            transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
        });


        const tier = ACTION_TO_TIER[action];
        
        const hash = await client.writeContract({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: [
                action.startsWith('mint')
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
            functionName: action.startsWith('mint') ? 'mintNFT' : 'upgradeNFT',
            args: action.startsWith('mint') ? [signal as `0x${string}`, BigInt(tier)] : [BigInt(tokenId!), BigInt(tier)],
        });
        return hash;

    } catch (err) {
        console.error(err);    
        return null;
    }
}

export async function initPublicClient(env: Env) {
        const client = createPublicClient({
            chain: worldchain,
            transport: http(WORLDCHAIN_RPC_URL),
        });
        return client;
} 

export async function rpcBatchCall(rpcUrl: string, method: string, params: any, maxRetries = 3) {
    const agent = new httpCall.Agent({
      keepAlive: true,
      maxSockets: 10,
      timeout: 60000,
    });
  
    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    };
  
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries <= maxRetries) {
      try {
        const response = await axios.post(rpcUrl, payload, {
          headers: {
            "Content-Type": "application/json",
          },
          httpAgent: agent, 
          timeout: 6000
        });
    
        if (response.data.error) {
          throw new Error(response.data.error);
        }
    
        return response.data.result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Error during RPC call");
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a rate limit error
        if (errorMessage.includes("limit reached") || errorMessage.includes("rate limit")) {
          console.warn(`Rate limit reached (attempt ${retries + 1}/${maxRetries + 1}), backing off...`);
          
          if (retries < maxRetries) {
            // Exponential backoff: 2^retries * 1000ms (1s, 2s, 4s, etc.)
            const backoffTime = Math.pow(2, retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            retries++;
            continue;
          }
        }
        
        // For non-rate limit errors or if we've exhausted retries
        console.error("RPC Request error:", error);
        throw lastError;
      }
    }
    
    // This should never be reached as the loop will either return or throw
    throw lastError || new Error("Unknown error during RPC call");
  }

export function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }
    
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            result[key] = serializeBigInt(obj[key]);
        }
        return result;
    }
    
    return obj;
}
