import { checkWallet, saveWallet } from "../database/queries/user.queries";
import { errorResponse, apiResponse } from "../utils/apiResponse.utils";
import { Env } from "../config/interface";
import axios from "axios";
import { WorldScanTransaction, FormattedTransaction } from "../config/interface";
import { WORLDSCAN_API_BASE_URL, WORLDSCAN_PATH, USDC_ADDRESS, V2_MAGNIFY_CONTRACT_ADDRESS,V1_MAGNIFY_CONTRACT_ADDRESS } from "../config/constant";
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js'

const contractAddresses = [
    V1_MAGNIFY_CONTRACT_ADDRESS, 
    V2_MAGNIFY_CONTRACT_ADDRESS
  ].map(addr => addr.toLowerCase());


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
    try {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("wallet");
        const result = await axios.get<WorldScanTransaction[]>(`${WORLDSCAN_API_BASE_URL}${WORLDSCAN_PATH.api}`, {
            params: {
                module: "account",
                action: "tokentx",
                contractaddress: USDC_ADDRESS.toLowerCase(),
                address: walletAddress,
                sort: "asc",
                apikey: env.WORLDSCAN_API_KEY
            }
        });

        const filteredTransactions: WorldScanTransaction[] = result.data.filter(tx =>
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
        const { payload, action, signal } = await request.json() as { 
            payload: ISuccessResult,
            action: string,
            signal: string
        };
        if (!payload || !action || !signal) {
            return errorResponse(400, 'Missing required fields: payload, action, signal');
        }
        
        const verified = (await verifyCloudProof(payload, env.WORLD_COIN_APP_ID as `app_${string}`, action, signal)) as IVerifyResponse
        if (verified.success) {
            return apiResponse(200, 'User verified successfully');
        }
        return errorResponse(400, 'User verification failed');
    } catch (error) {
        return errorResponse(500, 'Error verifying world user');
    }
}