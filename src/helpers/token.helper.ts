import { initPublicClient, rpcBatchCall } from "../utils/contract.utils";
import { Env } from "../config/interface";
import USDCAbi from "../config/contracts/USDC.json";
import { USDC_ADDRESS, WORLDCHAIN_ALCHEMY_RPC_URL, WORLDCHAIN_RPC_URL } from "../config/constant";
import axios from "axios";
import {ethers} from 'ethers';
import { convertHexToInteger } from "../utils/hashUtils";


export async function getEthBalance(walletAddress: string, env: Env) {
    try {
        const client = await initPublicClient(env);
        const balance = await client.getBalance({
            address: walletAddress as `0x${string}`
        })
        return balance;
    } catch (error) {
       throw error;
    }
}

export async function getUSDCBalance(walletAddress: string, env: Env) {
    try {
        const client = await initPublicClient(env);
        const balance = await client.readContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDCAbi,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`]
        })
        return balance;
    } catch (err) {
        throw err;
    }
}

export async function getTokenMetadata(tokenAddress: string, env: Env) {
    try {
        const [name, symbol, decimals] = await Promise.all([
            rpcBatchCall(WORLDCHAIN_RPC_URL, "eth_call", [
              { to: tokenAddress, data: new ethers.Interface(["function name() view returns (string)"]).encodeFunctionData("name", []) },
              "latest",
            ]),
            rpcBatchCall(WORLDCHAIN_RPC_URL, "eth_call", [
              { to: tokenAddress, data: new ethers.Interface(["function symbol() view returns (string)"]).encodeFunctionData("symbol", []) },
              "latest",
            ]),
            rpcBatchCall(WORLDCHAIN_RPC_URL, "eth_call", [
              { to: tokenAddress, data: new ethers.Interface(["function decimals() view returns (uint8)"]).encodeFunctionData("decimals", []) },
              "latest",
            ]),
          ]);
        return {
            tokenName: ethers.AbiCoder.defaultAbiCoder().decode(["string"], name)[0],
            tokenSymbol: ethers.AbiCoder.defaultAbiCoder().decode(["string"], symbol)[0],
            tokenDecimals: parseInt(ethers.AbiCoder.defaultAbiCoder().decode(["uint8"], decimals)[0]),
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Process token metadata in batches to avoid rate limiting
 * @param tokens Array of token objects with contractAddress and tokenBalance
 * @param env Environment variables
 * @param batchSize Number of tokens to process in each batch (default: 5)
 * @param delayMs Delay between batches in milliseconds (default: 1000)
 */
export async function batchProcessTokenMetadata(
    tokens: Array<{ contractAddress: string, tokenBalance: string }>, 
    env: Env,
    batchSize = 5,
    delayMs = 1000
) {
    // Using fixed values: batchSize=5, delayMs=1000
    const results = [];
    
    // Process tokens in batches
    for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        
        // Process current batch
        const batchPromises = batch.map(async (item) => {
            try {
                const tokenMetadata = await getTokenMetadata(item.contractAddress, env);
                const tokenBalance = convertHexToInteger(item.tokenBalance, tokenMetadata.tokenDecimals as number);
                
                return {
                    tokenAddress: item.contractAddress,
                    tokenName: tokenMetadata.tokenName,
                    tokenSymbol: tokenMetadata.tokenSymbol,
                    tokenDecimals: tokenMetadata.tokenDecimals,
                    tokenBalance: tokenBalance
                };
            } catch (err) {
                console.error(`Error processing token ${item.contractAddress}:`, err);
                // Return partial data if possible
                return {
                    tokenAddress: item.contractAddress,
                    tokenBalance: item.tokenBalance,
                    error: 'Failed to fetch complete metadata'
                };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Delay before processing the next batch (only if not the last batch)
        if (i + batchSize < tokens.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    return results;
}

export async function getWalletTokenPortfolio(walletAddress: string, env: Env) {
    try {
        const data = JSON.stringify({
            jsonrpc: "2.0",
            method: "alchemy_getTokenBalances",
            headers: {
                "Content-Type": "application/json",
            },
            params: [`${walletAddress}`],
            id: 42
        });
        const response = await axios.post(WORLDCHAIN_ALCHEMY_RPC_URL, data, {
            headers: {
                "Content-Type": "application/json",
            },
        })
        return response.data;
    } catch (err) {
        throw err;
    }
}