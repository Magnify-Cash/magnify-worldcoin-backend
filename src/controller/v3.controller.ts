import { Env } from "../config/interface";
import { readMagnifyV3Contract, readSoulboundContract } from "../helpers/v3.helper";
import { apiResponse, errorResponse } from "../utils/apiResponse.utils"
import { getEthBalance, getUSDCBalance, getTokenMetadata, getWalletTokenPortfolio } from "../helpers/token.helper";
import { serializeBigInt } from "../utils/contract.utils";
import { convertHexToInteger } from "../utils/hashUtils";
import { ethers } from "ethers";
import { WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3 } from "../config/constant";
import { rpcBatchCall } from "../utils/contract.utils";
import { getBlockTimestamp } from "../helpers/v3.helper";
// query params of the pool
import { TOKEN_METADATA } from "../config/constant";

// Create a map of contract addresses to metadata for efficient lookup - moved outside function for better performance
const TOKEN_ADDRESS_MAP: Record<string, typeof TOKEN_METADATA[keyof typeof TOKEN_METADATA]> = {
    [TOKEN_METADATA.WLD.tokenAddress.toLowerCase()]: TOKEN_METADATA.WLD,
    [TOKEN_METADATA.USDC.tokenAddress.toLowerCase()]: TOKEN_METADATA.USDC,
    [TOKEN_METADATA.ORO.tokenAddress.toLowerCase()]: TOKEN_METADATA.ORO
};

// Set of addresses we care about for fast lookup
const TRACKED_ADDRESSES = new Set(Object.keys(TOKEN_ADDRESS_MAP));

// Add the RPC_URLs array and sleep function, similar to v3.helper.ts
const RPC_URLS = [WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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


// @@ returns object of loan pool address and loan index
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

// @@ returns - loan data v3
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

export async function soulboundGetUserTokenIdController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("wallet");

        if (!walletAddress) {
            return errorResponse(400, 'walletAddress is required');
        }

        const data = await readSoulboundContract(env, 'userToId', walletAddress);
        const serializedData = serializeBigInt(data);
        return apiResponse(200, 'Soulbound user token id fetched successfully', { tokenId: serializedData });
    } catch (err) {
        return errorResponse(500, 'Error fetching soulbound user token id');
    }
}

export async function soulboundGetPoolAddressController(request: Request, env: Env) {
    try {
        const data = await readSoulboundContract(env, 'getMagnifyPools');
        const serializedData = (data as string[]).map((pool: string) => pool.toLowerCase());
        return apiResponse(200, 'Soulbound pool address fetched successfully', serializedData);   
    } catch (err) {
        return errorResponse(500, 'Error fetching soulbound pool address');
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

// V3 Magnify Contract Routes

// @@ returns - amount borrowed and liquidity available for borrowing
// TVL
export async function totalAssetsController(request: Request, env: Env) {
    try {
       //const result = await getTotalAssetsMagnifyV3(env);
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'totalAssets');
        const serializedResult = serializeBigInt(result) / 10 ** 6;
        return apiResponse(200, "totalAssets fetched successfully", { totalAssets: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error fetching total assets V3');
    }
}

export async function totalSupplyController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'totalSupply');
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'totalSupply fetched successfully', { totalSupply: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error fetching total supply V3 Pool');
    }
}


// check how much USDC will be needed to mint a given amount of LP Token
export async function previewMintController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const shares = url.searchParams.get("shares");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'previewMint', shares);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewMint successful', { lpAmount: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error previewMint');
    }
}

// check how much LP Token will be received for a given amount of USDC
export async function previewDepositController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const assets = url.searchParams.get("assets");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'previewDeposit', assets);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewDeposit successful', { usdcAmount: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error previewDepositCtrl');
    }
}
// same as previewDeposit
export async function previewWithdrawController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const assets = url.searchParams.get("assets");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'previewWithdraw', assets);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewWithdraw successful', { lpAmount: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error previewWithdrawCtrl');
    }
}
// same as previewMint
export async function previewRedeemController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const shares = url.searchParams.get("shares");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'previewRedeem', shares);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'previewRedeem successful', { usdcAmount: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error previewRedeemCtrl');
    }
}

export async function getActiveLoanController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get("wallet");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'getActiveLoan', wallet);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getActiveLoan successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error getActiveLoanCtrl');
    }
}

export async function getLoanHistoryController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get("wallet");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'getLoanHistory', wallet);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getLoanHistory successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error getLoanHistoryCtrl');
    }
}

export async function getAllActiveLoansController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");
        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'getAllActiveLoans');
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getAllActiveLoans successful', serializedResult);
    } catch (err) {
        return errorResponse(500, 'Error getAllActiveLoansCtrl');
    }
}

export async function getPoolActivationDateController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'startTimestamp');
        const serializedResult = serializeBigInt(result);
        
        // Convert timestamp to date format "YYYY-MM-DD HH:MM:SS"
        const date = new Date(Number(serializedResult) * 1000); // Convert to milliseconds
        const formattedDate = date.toISOString()
            .replace('T', ' ')      // Replace T with space
            .replace(/\.\d+Z$/, ''); // Remove milliseconds and Z
        
        return apiResponse(200, 'getPoolActivationDate successful', { 
            timestamp: serializedResult,
            formattedDate: formattedDate 
        });
    } catch (err) {
        return errorResponse(500, 'Error getPoolActivationDateCtrl');
    }
}

export async function getPoolLpSymbolController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'symbol');
        return apiResponse(200, 'getPoolLpSymbol successful', { symbol: result });
    } catch (err) {
        return errorResponse(500, 'Error getPoolLpSymbolCtrl');
    }
}   

export async function getPoolTierController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'tier');
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getPoolTier successful', { tier: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error getPoolTierCtrl');
    }
}

export async function getPoolTreasuryFeeController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'treasuryFee');
        const serializedResult = serializeBigInt(result) / 10 ** 2;
        return apiResponse(200, 'getPoolTreasuryFee successful', { treasuryFee: `${serializedResult}` });
    } catch (err) {
        return errorResponse(500, 'Error getPoolTreasuryFeeCtrl');
    }
}

export async function getPoolLoanDurationController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'loanPeriod');
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getPoolLoanDuration successful', { loanDuration: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error getPoolLoanDurationCtrl');
    }
}

export async function getPoolLoanInterestRateController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }
        
        const result = await readMagnifyV3Contract(env, contractAddress, 'loanInterestRate');
        const serializedResult = serializeBigInt(result) / 10 ** 2;
        return apiResponse(200, 'getPoolLoanInterestRate successful', { interestRate: `${serializedResult}` });
    } catch (err) {
        return errorResponse(500, 'Error getPoolLoanInterestRateCtrl');
    }
}

export async function getPoolStatusController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        // Define the functions to check
        const functions = [
            { name: "isWarmup", interface: new ethers.Interface(["function isWarmup() public view returns (bool)"]) },
            { name: "isActive", interface: new ethers.Interface(["function isActive() public view returns (bool)"]) },
            { name: "isCooldown", interface: new ethers.Interface(["function isCooldown() public view returns (bool)"]) },
            { name: "isExpired", interface: new ethers.Interface(["function isExpired() public view returns (bool)"]) }
        ];

        let results = null;
        
        // Try each RPC URL with retry logic
        for (let rpcUrlIndex = 0; rpcUrlIndex < RPC_URLS.length; rpcUrlIndex++) {
            let maxRetries = 3;
            let retryCount = 0;
            
            while (retryCount < maxRetries) {
                try {
                    // Execute batch call with current RPC URL
                    const batchPromises = functions.map(func => 
                        rpcBatchCall(RPC_URLS[rpcUrlIndex], "eth_call", [
                            { to: contractAddress, data: func.interface.encodeFunctionData(func.name, []) },
                            "latest",
                        ])
                    );
                    
                    results = await Promise.all(batchPromises);
                    // If successful, break out of the retry loop
                    break;
                } catch (err) {
                    retryCount++;
                    const backoffMs = 1000 * Math.pow(2, retryCount);
                    console.log(`RPC request failed for getPoolStatus using RPC URL #${rpcUrlIndex + 1}, retrying in ${backoffMs}ms (${retryCount}/${maxRetries})`);
                    await sleep(backoffMs);
                }
            }
            
            // If we got results, break out of the RPC URL loop
            if (results !== null) {
                break;
            }
            
            if (rpcUrlIndex < RPC_URLS.length - 1) {
                console.log(`Failed with RPC URL #${rpcUrlIndex + 1} for getPoolStatus, switching to next fallback URL`);
            }
        }
        
        // If we didn't get results after trying all URLs, throw an error
        if (results === null) {
            console.error(`Failed to get pool status after trying all ${RPC_URLS.length} RPC URLs`);
            throw new Error(`Could not retrieve pool status from any RPC endpoint after multiple attempts`);
        }
        
        // Parse hex string boolean values to actual booleans
        // '0x0000...0001' is true, '0x0000...0000' is false
        const parseHexBoolean = (hexValue: string): boolean => 
            hexValue === '0x0000000000000000000000000000000000000000000000000000000000000001';

        const [isWarmupHex, isActiveHex, isCooldownHex, isExpiredHex] = results;
        
        const status = {
            isWarmup: parseHexBoolean(isWarmupHex),
            isActive: parseHexBoolean(isActiveHex),
            isCooldown: parseHexBoolean(isCooldownHex),
            isExpired: parseHexBoolean(isExpiredHex),
        };

        const activeStatus = Object.keys(status).find(key => status[key as keyof typeof status] === true);
        return apiResponse(200, 'getPoolStatus successful', { status: activeStatus });
    } catch (err) {
        return errorResponse(500, 'Error getPoolStatusCtrl');
    }
}

export async function getUserMaxDepositController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get("wallet");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress || !wallet) {
            return errorResponse(400, 'contractAddress and wallet are required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'maxDeposit', wallet);
        const serializedResult = serializeBigInt(result);
        return apiResponse(200, 'getUserMaxDeposit successful', { maxDeposit: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error getUserMaxDepositCtrl');
    }
}   

export async function getUserMaxPoolDataController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get("wallet");
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress || !wallet) {
            return errorResponse(400, 'contractAddress and wallet are required');
        }
        
        const [maxDeposit, maxMint, maxRedeem, maxWithdraw] = await Promise.all([
            rpcBatchCall(WORLDCHAIN_RPC_URL, "eth_call", [ 
                { to: contractAddress, data: new ethers.Interface(["function maxDeposit(address owner) external view returns (uint256 maxAssets)"]).encodeFunctionData("maxDeposit", [wallet]) },
                "latest",
            ]),
            rpcBatchCall(WORLDCHAIN_RPC_URL, "eth_call", [
                { to: contractAddress, data: new ethers.Interface(["function maxMint(address owner) external view returns (uint256 maxAssets)"]).encodeFunctionData("maxMint", [wallet]) },
                "latest",
            ]),
            rpcBatchCall(WORLDCHAIN_RPC_URL, "eth_call", [
                { to: contractAddress, data: new ethers.Interface(["function maxRedeem(address owner) external view returns (uint256 maxAssets)"]).encodeFunctionData("maxRedeem", [wallet]) },
                "latest",
            ]),
            rpcBatchCall(WORLDCHAIN_RPC_URL, "eth_call", [
                { to: contractAddress, data: new ethers.Interface(["function maxWithdraw(address owner) external view returns (uint256 maxAssets)"]).encodeFunctionData("maxWithdraw", [wallet]) },
                "latest",
            ]),
        ]);
        const serializedResult = {
            maxDeposit: serializeBigInt(maxDeposit),
            maxMint: serializeBigInt(maxMint),
            maxRedeem: serializeBigInt(maxRedeem),
            maxWithdraw: serializeBigInt(maxWithdraw),
        }
        return apiResponse(200, 'getUserMaxPoolData successful', serializedResult);  
    } catch (err) {
        return errorResponse(500, 'Error getUserMaxPoolDataCtrl');
    }
}

export async function getPoolLiquidityController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'liquidity');
        const serializedResult = serializeBigInt(result) / 10 ** 6;
        return apiResponse(200, 'getPoolLiquidity successful', { liquidity: serializedResult });
        
    } catch (err) {
        return errorResponse(500, 'Error getPoolLiquidityCtrl');
    }
}

export async function getPoolEndTimestampController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'endTimestamp');
        const serializedResult = serializeBigInt(result);

        const date = new Date(Number(serializedResult) * 1000); // Convert to milliseconds
        const formattedDate = date.toISOString()
            .replace('T', ' ')      // Replace T with space
            .replace(/\.\d+Z$/, ''); // Remove milliseconds and Z
        
        return apiResponse(200, 'getPoolDeactivationDate successful', { 
            timestamp: serializedResult,
            formattedDate: formattedDate 
        });
    } catch (err) {
        return errorResponse(500, 'Error getPoolEndTimestampCtrl');
    }
}

export async function getPoolNameController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'name');
        return apiResponse(200, 'getPoolName successful', { name: result });
    } catch (err) {
        return errorResponse(500, 'Error getPoolNameCtrl');
    }
}

export async function getPoolOriginationFeeController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'originationFee');
        const serializedResult = serializeBigInt(result) / 10 ** 2;
        return apiResponse(200, 'getPoolOriginationFee successful', { originationFee: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error getPoolOriginationFeeCtrl');
    }
}

export async function getPoolLoanAmountController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        const result = await readMagnifyV3Contract(env, contractAddress, 'loanAmount');
        const serializedResult = serializeBigInt(result) / 10 ** 6;
        return apiResponse(200, 'getPoolLoanAmount successful', { loanAmount: serializedResult });
    } catch (err) {
        return errorResponse(500, 'Error getPoolLoanAmountCtrl');
    }
}

export async function getPoolWarmupDurationTestnetController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const contractAddress = url.searchParams.get("contract");

        if (!contractAddress) {
            return errorResponse(400, 'contractAddress is required');
        }

        let deployedBlockNumber;
        if (contractAddress === '0x6892f50c8a2ff41c8fd58c2405b0fb29ff77aa1c') {
            deployedBlockNumber = 11214391;
        } else if (contractAddress === '0x0ab2554e4c8d4d7c75c4fe6314a4ef62be800530') {
            deployedBlockNumber = 11388448;
        } else {
            return errorResponse(400, 'Unknown contract address, no deployment block number found');
        }

        const deployedBlockTimestamp = await getBlockTimestamp(env, deployedBlockNumber);
        const startTimestampResult = await readMagnifyV3Contract(env, contractAddress, 'startTimestamp');
        const startTimestamp = Number(serializeBigInt(startTimestampResult));
        
        // Calculate warmup period in seconds (ensure both are the same type)
        const warmupPeriodSeconds = startTimestamp - Number(deployedBlockTimestamp);
        // Convert to days (86400 seconds in a day)
        const warmupPeriodDays = warmupPeriodSeconds / 86400;

        const result = {
            warmupPeriodDays: parseFloat(warmupPeriodDays.toFixed(2))
        }
        return apiResponse(200, 'Warmup period calculated successfully', serializeBigInt(result));
    } catch (err) {
        console.log(err);
        return errorResponse(500, 'Error calculating pool warmup duration');
    }
}

export async function triggerProcessDefaultPoolController(env: Env) {
    try {
        const poolAddresses = await readSoulboundContract(env, 'getMagnifyPools');
        console.log(poolAddresses);
    } catch (err) {
        throw err;
    }
}

