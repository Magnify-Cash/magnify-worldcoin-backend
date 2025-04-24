import { initPublicClient, rpcBatchCall } from "../utils/contract.utils";
import { Env } from "../config/interface";
import USDCAbi from "../config/contracts/USDC.json";
import { USDC_ADDRESS, WORLDCHAIN_ALCHEMY_RPC_URL, WORLDCHAIN_RPC_URL } from "../config/constant";
import axios from "axios";
import {ethers} from 'ethers';


export async function getEthBalance(walletAddress: string, env: Env) {
    try {
        const client = await initPublicClient(env, WORLDCHAIN_RPC_URL);
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
        const client = await initPublicClient(env, WORLDCHAIN_RPC_URL);
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