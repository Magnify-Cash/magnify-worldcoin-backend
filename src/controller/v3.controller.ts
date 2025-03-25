import { Env } from "../config/interface";
import { getSoulboundData } from "../helpers/v3.helper";
import { apiResponse, errorResponse } from "../utils/apiResponse.utils"
import { getEthBalance, getUSDCBalance, getTokenMetadata, getWalletTokenPortfolio, batchProcessTokenMetadata } from "../helpers/token.helper";
import { serializeBigInt } from "../utils/contract.utils";
import { convertHexToInteger } from "../utils/hashUtils";


export async function getSoulboundDataController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const tokenId = url.searchParams.get("tokenId");
        
        if (!tokenId) {
            return errorResponse(400, 'tokenId is required');
        }
        
        const data = await getSoulboundData(tokenId, env);
        const serializedData = serializeBigInt(data);
        return apiResponse(200, 'Soulbound data fetched successfully', { serializedData });
    } catch (err) {
        return errorResponse(500, 'Error fetching soulbound data');
    }
}

export async function getEthBalanceController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("wallet");

        if (!walletAddress) {
            return errorResponse(400, 'walletAddress is required');
        }
        const balance = await getEthBalance(walletAddress, env);
        const serializedBalance = serializeBigInt(balance) / 10 ** 18;
        return apiResponse(200, 'Eth balance fetched successfully', { ethBalance: serializedBalance });
    } catch (err) {
        console.log(err);
        return errorResponse(500, 'Error fetching eth balance');
    }
}  

export async function getUSDCBalanceController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("wallet");

        if (!walletAddress) {
            return errorResponse(400, 'walletAddress is required');
        }   
        const balance = await getUSDCBalance(walletAddress, env);
        const serializedBalance = serializeBigInt(balance) / 10 ** 6;
        return apiResponse(200, 'USDC balance fetched successfully', { usdcBalance: serializedBalance });
    } catch (err) {
        return errorResponse(500, 'Error fetching USDC balance');
    }
}

export async function getTokenMetadataController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const tokenAddress = url.searchParams.get("tokenAddress");

        if (!tokenAddress) {
            return errorResponse(400, 'tokenAddress is required');
        }   
        const metadata = await getTokenMetadata(tokenAddress, env);
        return apiResponse(200, 'Token metadata fetched successfully', { metadata });
    } catch (err) {
        return errorResponse(500, 'Error fetching token metadata');
    }
}

export async function getWalletTokenPortfolioController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("wallet");

        if (!walletAddress) {
            return errorResponse(400, 'walletAddress is required');
        }
        
        const portfolio = await getWalletTokenPortfolio(walletAddress, env);
        const tokenBalances = portfolio.result.tokenBalances;
        
        // Dynamically adjust batch size and delay based on token count
        let batchSize = 5;  // Default batch size
        let delayMs = 1000; // Default delay in milliseconds
        
        const tokenCount = tokenBalances.length;
        console.log(`Processing ${tokenCount} tokens for wallet ${walletAddress}`);
        
        // Adjust parameters based on token count
        if (tokenCount > 50) {
            // For very large wallets, use smaller batches and longer delays
            batchSize = 3;
            delayMs = 2000;
        } else if (tokenCount > 20) {
            // For medium-sized wallets
            batchSize = 4;
            delayMs = 1500;
        } else if (tokenCount < 5) {
            // For very small wallets, no need to batch
            batchSize = tokenCount;
            delayMs = 0;
        }
        
        // Process tokens in batches to avoid rate limiting
        const serializedResult = await batchProcessTokenMetadata(tokenBalances, env, batchSize, delayMs);
        
        return apiResponse(200, 'Wallet token portfolio fetched successfully', serializedResult);
    } catch (err) {
        console.error("Error in getWalletTokenPortfolioController:", err);
        return errorResponse(500, 'Error fetching wallet token portfolio');
    }
}
