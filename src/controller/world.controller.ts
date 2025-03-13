import { checkWallet, saveWallet } from "../database/queries/user.queries";
import { errorResponse, apiResponse } from "../utils/apiResponse.utils";
import { Env } from "../config/interface";
import axios from "axios";
import { WorldScanTransaction, FormattedTransaction } from "../config/interface";
import { WORLDSCAN_API_BASE_URL, WORLDSCAN_PATH, USDC_ADDRESS } from "../config/constant";
import { ISuccessResult} from '@worldcoin/idkit'
import { hashToField } from "../utils/hashUtils";
import { mintNFT, getContractAddress,  getLoanV2, getLoanData } from "../utils/contract.utils";
import { ClaimAction } from "../config/interface";
import { exportCSV } from "../utils/common.utils";
import { V1_MAGNIFY_CONTRACT_ADDRESS } from "../config/constant";



export async function saveWalletController(request: Request, env: Env) {
    try {
        const { wallet, notification } = (await request.json()) as { wallet: string; notification: boolean };
        const result = await saveWallet(wallet, notification, env);
        if (!result) {
            return errorResponse(400, 'Failed to save wallet');
        }
        return apiResponse(200, 'Wallet saved successfully', result);
    } catch (error) {
        return errorResponse(500, 'Internal server error');
    }
}

export async function checkWalletController(request: Request, env: Env) {
    try {
        const url = new URL(request.url);
        const wallet = url.searchParams.get('wallet');
        if (!wallet) {
            return errorResponse(400, 'Wallet address is required');
        }
        const result = await checkWallet(wallet, env);
        if (!result) {
            return apiResponse(400, 'Wallet not found', {exists: false});
        }
        return apiResponse(200, 'Wallet found', {  exists: true });
    } catch (error) {
        return errorResponse(500, 'Internal server error');
    }
}

export async function txHistoryController(request: Request, env: Env) {
    const contractAddresses = await getContractAddress(env);
    try {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("wallet");
        const result = await axios.get<{ result: WorldScanTransaction[] }>(`${WORLDSCAN_API_BASE_URL}${WORLDSCAN_PATH.api}`, {
            params: {
                module: "account",
                action: "tokentx",
                contractaddress: USDC_ADDRESS.toLowerCase(),
                address: walletAddress,
                sort: "asc",
                apikey: env.WORLDSCAN_API_KEY
            }
        });

        const filteredTransactions: WorldScanTransaction[] = result.data.result.filter((tx: WorldScanTransaction) =>
            contractAddresses.includes(tx.to.toLowerCase()) || contractAddresses.includes(tx.from.toLowerCase())
          );
      
          const formattedTransactions: FormattedTransaction[] = filteredTransactions.map(tx => ({
            transactionHash: tx.hash,
            blockNumber: tx.blockNumber,
            from: tx.from,
            to: tx.to,
            amount: (parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))).toFixed(6),
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            status: tx.to.toLowerCase() === (walletAddress || '').toLowerCase() ? "received" : "repaid"
          }));
        return apiResponse(200, 'Transaction history retrieved', formattedTransactions);
    } catch (error) {
        console.log(error);
        return errorResponse(500, 'Failed to retrieve transaction history');
    }
}

export async function sendWorldScanNotificationController(request: Request, env: Env) {
    try {
        const requestBody: { app_id: string; wallet_addresses: string[]; title: string; message: string; mini_app_path: string } = await request.json();
        const { app_id, wallet_addresses, title, message, mini_app_path } = requestBody;

        const result = await axios.post(
            `${WORLDSCAN_PATH.notification}`,
            {
                app_id,
                wallet_addresses,
                title,
                message,
                mini_app_path       
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.WORLDSCAN_API_KEY}`
                }
            }
        );
        if (!result) {
            return errorResponse(400, 'Failed to send notification');
        }
        return apiResponse(200, 'Notification sent successfully', result.data);
    } catch (error) {
        return errorResponse(500, 'Failed to send notification');
    }
}

export async function verifyWorldUserController(request: Request, env: Env) {
    try {
        const { payload, action, signal, tokenId } = await request.json() as {
            payload: ISuccessResult,
            action: string,
            signal: string,
            tokenId: string
        };

        if (!payload || !action || !signal) {
            return errorResponse(400, 'Missing required fields: payload, action, signal');
        }
        const verifyResponse = await axios.post(
            `https://developer.worldcoin.org/api/v2/verify/${env.WORLD_COIN_APP_ID}`,
            {
                nullifier_hash: payload.nullifier_hash,
                proof: payload.proof,
                merkle_root: payload.merkle_root,
                verification_level: payload.verification_level,
                action: action,
                signal_hash: hashToField(signal ?? '').digest,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                }
            }
        );
        if (!verifyResponse) {
            return errorResponse(400, 'Failed to verify user');
        }

        const transactionHash = await mintNFT(action as ClaimAction, signal as `0x${string}`, tokenId, env);
        if (!transactionHash) {
            return errorResponse(400, 'Failed to mint or upgrade NFT');
        }
        return apiResponse(200, 'User verified successfully', { ...verifyResponse.data, transactionHash });
    } catch (error) {
        console.error("Verification Error:", error);
        return errorResponse(500, 'Error verifying world user');
    }
}

export async function getLoanV1Controller(request: Request, env: Env) {
    try {
        const result = await getLoanData(V1_MAGNIFY_CONTRACT_ADDRESS, 'v1') as any[];
        const resultV2 = await getLoanData(env.V2_MAGNIFY_CONTRACT_ADDRESS, 'v2') as any[];
        
        // Combine both results
        const allLoans = [...result, ...resultV2].filter(item => item !== null && item !== undefined);
        
        // Check if we have any loans
        if (allLoans.length === 0) {
            return apiResponse(200, 'No loan data available', []);
        }
        
        const sanitizedData = allLoans.map(item => ({
            user_wallet: item.user_wallet || '',
            loan_amount: item.loan_amount || '',
            loan_repaid_amount: item.loan_repaid_amount || '',
            loan_term: typeof item.loan_term === 'number' ? item.loan_term : 
                      (typeof item.loan_term === 'object' ? '30' : ''),
            time_loan_started: item.time_loan_started || '',
            time_loan_ended: item.time_loan_ended || '',
            is_defaulted: item.is_defaulted,
            version: item.version
        }));
        
        // Generate CSV
        const csvResult = exportCSV(sanitizedData, 'loan_data.csv');
        
        // Support both download and API response modes
        const url = new URL(request.url);
        const downloadMode = url.searchParams.get('download') === 'true';
        
        if (downloadMode) {
            // Return a response with CSV content for download
            return new Response(csvResult.csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${csvResult.filename}"`
                }
            });
        } else {
            // Return API response with the data instead of file info
            return apiResponse(200, 'Loan data retrieved successfully', {
                recordCount: sanitizedData.length,
                loans: sanitizedData
            });
        }
    } catch (error) {
        console.log(error);
        return errorResponse(500, 'Failed to get loan');
    }
}