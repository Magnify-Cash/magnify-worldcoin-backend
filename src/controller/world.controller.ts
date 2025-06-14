import { checkWallet, saveWallet } from "../database/queries/user.queries";
import { errorResponse, apiResponse } from "../utils/apiResponse.utils";
import { Env } from "../config/interface";
import axios from "axios";
import { WorldScanTransaction, FormattedTransaction } from "../config/interface";
import { WORLDSCAN_API_BASE_URL, WORLDSCAN_PATH, USDC_ADDRESS, WORLDCHAIN_RPC_URL, V1_MAGNIFY_CONTRACT_ADDRESS } from "../config/constant";
import { ISuccessResult} from '@worldcoin/idkit'
import { hashToField } from "../utils/hashUtils";
import { mintNFT, getContractAddress, initPublicClient, serializeBigInt, checkUserV2LoanStatus } from "../utils/contract.utils";
import { ClaimAction } from "../config/interface";
import MagnifyV1Abi from "../config/contracts/MagnifyV1.json"
import MagnifyV2Abi from "../config/contracts/MagnifyV2.json"



export async function saveWalletController(request: Request, env: Env) {
    try {
        // Add logging to debug the request
        console.log('SaveWallet request received, parsing body...');
        
        const requestBody = await request.json() as { wallet?: string; notification?: boolean };
        console.log('Parsed request body:', JSON.stringify(requestBody));
        
        const { wallet, notification } = requestBody;
        
        // Validate required parameters
        if (!wallet || typeof wallet !== 'string') {
            console.error('Invalid wallet parameter:', wallet);
            return errorResponse(400, 'Wallet address is required and must be a string');
        }
        
        // Default notification to false if not provided or invalid
        const validNotification = typeof notification === 'boolean' ? notification : false;
        
        console.log('Calling saveWallet with params:', { wallet, notification: validNotification });
        
        const result = await saveWallet(wallet, validNotification, env);
        if (!result) {
            return errorResponse(400, 'Failed to save wallet');
        }
        return apiResponse(200, 'Wallet saved successfully', result);
    } catch (error) {
        console.error('SaveWalletController error:', error);
        // More specific error message for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(500, `Internal server error: ${errorMessage}`);
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
                    'Authorization': `Bearer ${env.WORLDCOIN_API_KEY}`,
                    'User-Agent': 'Cloudflare-Worker/1.0'
                }
            }
        );
        if (!result) {
            return errorResponse(400, 'Failed to send notification');
        }
        return apiResponse(200, 'Notification sent successfully', result.data.result);
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

        const client = await initPublicClient(env, WORLDCHAIN_RPC_URL);
        const userNFTid = await client.readContract({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: MagnifyV1Abi,
            functionName: "userNFT",
            args: [signal]
        })
        
        // Skip V2 loan status check if user has no NFT
        if (userNFTid !== 0n) {
            const v2LoanStatus = await checkUserV2LoanStatus(userNFTid, signal as `0x${string}`, env);
            if (v2LoanStatus) {
                return errorResponse(400, 'User has active/defaulted loans on V1/V2');
            }
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