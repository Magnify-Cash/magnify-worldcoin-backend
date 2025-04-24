import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Bytes, Hex, Hash } from 'ox';
import { ACTION_TO_TIER, Env, ClaimAction } from '../config/interface';
import { worldchain, worldchainSepolia } from 'viem/chains';
import { V1_MAGNIFY_CONTRACT_ADDRESS, WORLDCHAIN_RPC_URL, V2_STAGING_CONTRACT_ADDRESS } from '../config/constant';
import axios from 'axios';
import httpCall from 'http';
import MagnifySoulboundAbi from '../config/contracts/MagnifySoulbound.json';
import MagnifyV2Abi from '../config/contracts/MagnifyV2.json';
import MagnifyV1Abi from '../config/contracts/MagnifyV1.json';
import { readSoulboundContract } from '../helpers/v3.helper';

export async function getContractAddress(env: Env) {
    const v3PoolAddress = await readSoulboundContract(env, 'getMagnifyPools');
    const contractAddresses = [
        V1_MAGNIFY_CONTRACT_ADDRESS,
        String(env.V2_MAGNIFY_CONTRACT_ADDRESS || '').trim(),
        ...(v3PoolAddress as string[])
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

       
        //const tier = ACTION_TO_TIER[action];
        
        const hash = await client.writeContract({
            address: env.SOULBOUND_NFT_CONTRACT_ADDRESS as `0x${string}`,
            abi: MagnifySoulboundAbi,
            functionName: 'mintNFT',
            args: [signal as `0x${string}`, 100n],
        });
        return hash;

    } catch (err) {
        console.error(err);    
        return null;
    }
}

async function checkLoanStatus(client: any, contractAddress: `0x${string}`, abi: any, userNFTid: any) {
    const loanStatus = await client.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "loans",
        args: [userNFTid]
    });
    
    // Check if there are no loans (all values are 0n and isActive is false)
    if (loanStatus[0] === 0n && loanStatus[1] === 0n && loanStatus[2] === false && loanStatus[3] === 0n && loanStatus[4] === 0n) {
        return false;
    }

    const serializedStatus = serializeBigInt(loanStatus);
    const startTime = serializedStatus[1];
    const currentStatus = serializedStatus[2];
    const loanPeriod = serializedStatus[4];
    
    return startTime + loanPeriod < Date.now() || currentStatus === true;
}

export async function checkUserV2LoanStatus(userNFTid: any, env: Env) {
    const client = await initPublicClient(env, WORLDCHAIN_RPC_URL);

    const v2Status = await checkLoanStatus(
        client,
        env.V2_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
        MagnifyV2Abi,
        userNFTid
    );
    if (v2Status) return true;

    const v2StagingStatus = await checkLoanStatus(
        client,
        V2_STAGING_CONTRACT_ADDRESS as `0x${string}`,
        MagnifyV2Abi,
        userNFTid
    );
    if (v2StagingStatus) return true;

    const v1Status = await checkLoanStatus(
        client,
        V1_MAGNIFY_CONTRACT_ADDRESS,
        MagnifyV1Abi,
        userNFTid
    );
    if (v1Status) return true;

    return false;
}

export async function initPublicClient(env: Env, rpcUrl: string) {
        const client = createPublicClient({
            chain: worldchain,
            transport: http(rpcUrl),
        });
        return client;
} 

export async function rpcBatchCall(rpcUrl: string, method: string, params: any) {
    const agent = new httpCall.Agent({
      keepAlive: true,
      maxSockets: 10,
      timeout: 10000,
    });
  
    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    };
  
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
      console.error("RPC Request error:", error);
      throw error instanceof Error ? error.message : "Error during RPC call";
    }
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
