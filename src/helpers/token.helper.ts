import { initPublicClient } from "../utils/contract.utils";
import { Env } from "../config/interface";
import USDCAbi from "../config/contracts/USDC.json";
import { USDC_ADDRESS, WORLDCHAIN_ALCHEMY_RPC_URL } from "../config/constant";
import axios from "axios";


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
        const tokenDecimals = await client.readContract({
            address: tokenAddress as `0x${string}`,
            abi: USDCAbi,
            functionName: 'decimals'
        })
        return {
            tokenName,
            tokenSymbol,
            tokenDecimals
        };
    } catch (err) {
        throw err;
    }
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
        })
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