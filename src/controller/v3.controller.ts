import { Env } from "../config/interface";
import { getSoulboundData } from "../helpers/v3.helper";
import { apiResponse, errorResponse } from "../utils/apiResponse.utils"
import { getEthBalance, getUSDCBalance, getTokenMetadata, getWalletTokenPortfolio } from "../helpers/token.helper";
import { serializeBigInt } from "../utils/contract.utils";
import { convertHexToInteger } from "../utils/hashUtils";
import { TOKEN_METADATA } from "../config/constant";

// Create a map of contract addresses to metadata for efficient lookup - moved outside function for better performance
const TOKEN_ADDRESS_MAP: Record<string, typeof TOKEN_METADATA[keyof typeof TOKEN_METADATA]> = {
    [TOKEN_METADATA.WLD.tokenAddress.toLowerCase()]: TOKEN_METADATA.WLD,
    [TOKEN_METADATA.USDC.tokenAddress.toLowerCase()]: TOKEN_METADATA.USDC,
    [TOKEN_METADATA.ORO.tokenAddress.toLowerCase()]: TOKEN_METADATA.ORO
};

// Set of addresses we care about for fast lookup
const TRACKED_ADDRESSES = new Set(Object.keys(TOKEN_ADDRESS_MAP));

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
        
        // Start both API calls in parallel
        const [portfolioPromise, ethBalancePromise] = await Promise.all([
            getWalletTokenPortfolio(walletAddress, env),
            getEthBalance(walletAddress, env)
        ]);
        
        const portfolio = portfolioPromise;
        const ethBalance = ethBalancePromise;
        
        // Initialize with ETH balance already calculated to save processing time later
        const tokenPortfolio: Array<{
            tokenAddress?: string;
            tokenName: string;
            tokenSymbol?: string;
            tokenDecimals: number;
            tokenBalance: number;
        }> = [{
            tokenName: 'ETH',
            tokenSymbol: 'ETH',
            tokenDecimals: 18,
            tokenBalance: Number(serializeBigInt(ethBalance)) / 10 ** 18
        }];
        
        // Process each token balance
        const tokenBalances = portfolio.result.tokenBalances;
        
        for (const token of tokenBalances) {
            const contractAddress = token.contractAddress.toLowerCase();
            
            // Only process if it's one of our tracked tokens (fast lookup with Set)
            if (TRACKED_ADDRESSES.has(contractAddress)) {
                const metadata = TOKEN_ADDRESS_MAP[contractAddress];
                const tokenBalance = convertHexToInteger(token.tokenBalance, metadata.tokenDecimals);
                
                // Only add tokens with non-zero balance for efficiency
                if (tokenBalance > 0) {
                    tokenPortfolio.push({
                        tokenAddress: metadata.tokenAddress,
                        tokenName: metadata.tokenName,
                        tokenSymbol: metadata.tokenSymbol,
                        tokenDecimals: metadata.tokenDecimals,
                        tokenBalance: tokenBalance
                    });
                }
            }
        }
        
        return apiResponse(200, 'Wallet token portfolio fetched successfully', tokenPortfolio);
    } catch (err) {
        return errorResponse(500, 'Error fetching wallet token portfolio');
    }
}
