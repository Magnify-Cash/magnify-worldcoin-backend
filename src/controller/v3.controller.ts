import { Env } from "../config/interface";
import { getSoulboundData } from "../helpers/v3.helper";
import { apiResponse, errorResponse } from "../utils/apiResponse.utils"
import { getEthBalance, getUSDCBalance, getTokenMetadata, getWalletTokenPortfolio } from "../helpers/token.helper";
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
        const result = portfolio.result.tokenBalances;
        const serializedPromises =  result.map(async (item: {
            contractAddress: string,
            tokenBalance: string
        }) => {
           const tokenMetadata = await getTokenMetadata(item.contractAddress, env);
           const tokenBalance = convertHexToInteger(item.tokenBalance, tokenMetadata.tokenDecimals as number);
           return {
            tokenAddress: item.contractAddress,
            tokenName: tokenMetadata.tokenName,
            tokenSymbol: tokenMetadata.tokenSymbol,
            tokenDecimals: tokenMetadata.tokenDecimals,
            tokenBalance: tokenBalance
           }
        })
        const serializedResult = await Promise.all(serializedPromises);
        return apiResponse(200, 'Wallet token portfolio fetched successfully', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error fetching wallet token portfolio');
    }
}
