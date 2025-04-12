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

export async function checkUserV2LoanStatus(userNFTid: any, env: Env) {
    const client = await initPublicClient(env, WORLDCHAIN_RPC_URL);

    const loanV2Status = await client.readContract({
        address: env.V2_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
        abi: MagnifyV2Abi,
        functionName: "loans",
        args: [userNFTid]
    })
    const serializeLoanV2Status = serializeBigInt(loanV2Status);
    const loanV2StartTime = serializeLoanV2Status[1];
    const loanV2LoanPeriod = serializeLoanV2Status[4];

    if (loanV2StartTime + loanV2LoanPeriod < Date.now()) {
        return true;
    }

    const loanV2StagingStatus = await client.readContract({
        address: V2_STAGING_CONTRACT_ADDRESS as `0x${string}`,
        abi: MagnifyV2Abi,
        functionName: "loans",
        args: [userNFTid]
    })
    const serializeLoanV2StagingStatus = serializeBigInt(loanV2StagingStatus);
    const loanV2StagingStartTime = serializeLoanV2StagingStatus[1];
    const loanV2StagingLoanPeriod = serializeLoanV2StagingStatus[4];

    if (loanV2StagingStartTime + loanV2StagingLoanPeriod < Date.now()) {
        return true;
    }
    
    const loanV1Status = await client.readContract({
        address: V1_MAGNIFY_CONTRACT_ADDRESS,
        abi: MagnifyV1Abi,
        functionName: "loans",
        args: [userNFTid]
    })
    const serializeLoanV1Status = serializeBigInt(loanV1Status);
    const loanV1StartTime = serializeLoanV1Status[1];
    const loanV1LoanPeriod = serializeLoanV1Status[4];

    if (loanV1StartTime + loanV1LoanPeriod < Date.now()) {
        return true;
    }
    if (serializeLoanV2Status[2] === true || serializeLoanV1Status[2] === true) {
        return true;
    } 
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
