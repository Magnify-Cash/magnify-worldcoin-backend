import { Env } from "../config/interface";
import { getSoulboundData, getSoulboundTokenURI, getTotalAssetsMagnifyV3, readMagnifyV3Contract, readSoulboundContract } from "../helpers/v3.helper";
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
        const data = await readSoulboundContract(env, 'getNFTData', tokenId);
        const serializedData = serializeBigInt(data);
        return apiResponse(200, 'Soulbound data fetched successfully', serializedData);
    } catch (err) {
        return errorResponse(500, 'Error fetching soulbound data');
    }
}

export async function soulboundTokenURIController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const tokenId = url.searchParams.get("tokenId");
        
        if (!tokenId) {
            return errorResponse(400, 'tokenId is required');
        }

        const data = await readSoulboundContract(env, 'tokenURI', tokenId);
        return apiResponse(200, 'Soulbound token URI fetched successfully', data);

    } catch (err) {
        return errorResponse(500, 'Error fetching soulbound token URI')
    }
}

export async function soulboundGetLoanHistoryController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const tokenId = url.searchParams.get("tokenId");

        if (!tokenId) {
            return errorResponse(400, 'tokenId is required');
        }

        const data = await readSoulboundContract(env, 'getLoanHistory', tokenId);
        return apiResponse(200, 'Soulbound loan history fetched successfully', data);
    } catch (err) {
        return errorResponse(500, 'Error fetching soulbound loan history');
    }
}   

export async function soulboundGetLoanHistoryDataController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const tokenId = url.searchParams.get("tokenId");

        if (!tokenId) {
            return errorResponse(400, 'tokenId is required');
        }

        const data = await readSoulboundContract(env, 'getLoanHistoryData', tokenId);
        return apiResponse(200, 'Soulbound loan history data fetched successfully', data);
    } catch (err) {
        return errorResponse(500, 'Error fetching soulbound loan history data');
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

export async function totalAssetsController(request: Request, env: Env) {
    try {
       //const result = await getTotalAssetsMagnifyV3(env);
        const result = await readMagnifyV3Contract(env, 'totalAssets');
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, "totalAssets fetched successfully", { totalAssets: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error fetching total assets V3');
    }
}

export async function previewMintController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const shares = url.searchParams.get("shares");

        const result = await readMagnifyV3Contract(env, 'previewMint', shares);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewMint successful', serializedResult);
    } catch (err) {
        console.log(err);
        return errorResponse(500, 'Error previewMint');
    }
}

export async function previewDepositController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const assets = url.searchParams.get("assets");

        const result = await readMagnifyV3Contract(env, 'previewDeposit', assets);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewDeposit successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error previewDepositCtrl');
    }
}

export async function previewWithdrawController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const assets = url.searchParams.get("assets");

        const result = await readMagnifyV3Contract(env, 'previewWithdraw', assets);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewWithdraw successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error previewWithdrawCtrl');
    }
}

export async function previewRedeemController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const shares = url.searchParams.get("shares");

        const result = await readMagnifyV3Contract(env, 'previewRedeem', shares);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewRedeem successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error previewRedeemCtrl');
    }
}

export async function getActiveLoanController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get("wallet");

        const result = await readMagnifyV3Contract(env, 'getActiveLoan', wallet);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getActiveLoan successful', serializedResult);
    } catch (err) {
        console.log(err);
        return errorResponse(500, 'Error getActiveLoanCtrl');
    }
}

export async function getLoanHistoryController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get("wallet");

        const result = await readMagnifyV3Contract(env, 'getLoanHistory', wallet);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getLoanHistory successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error getLoanHistoryCtrl');
    }
}

export async function getAllActiveLoansController(request: Request, env: Env) {
    try {
        const result = await readMagnifyV3Contract(env, 'getAllActiveLoans');
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getAllActiveLoans successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error getAllActiveLoansCtrl');
    }
}
