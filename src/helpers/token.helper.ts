import { initPublicClient } from "../utils/contract.utils";
import { Env } from "../config/interface";
import USDCAbi from "../config/contracts/USDC.json";
import { USDC_ADDRESS } from "../config/constant";


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
        const client = await initPublicClient(env);
        const tokenName = await client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: USDCAbi,
            functionName: 'name'
        })
        const tokenSymbol = await client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: USDCAbi,
            functionName: 'symbol'
        })        
        return {
            tokenName,
            tokenSymbol
        };
    } catch (err) {
        throw err;
    }
}