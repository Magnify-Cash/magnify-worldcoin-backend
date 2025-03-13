import { createPublicClient } from "viem";
import { worldchain } from "viem/chains";
import { WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3 } from "../config/constant";
import { http } from "viem";

// Cache to store previously fetched timestamps
const blockTimestampCache: Record<string, bigint> = {};

// Helper for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Array of RPC URLs to try in order
const RPC_URLS = [WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3];

export async function getBlockTimestamp(blockNumber: bigint): Promise<bigint> {
    const blockNumberStr = blockNumber.toString();
    
    // Check if we have this block timestamp in cache
    if (blockTimestampCache[blockNumberStr]) {
        return blockTimestampCache[blockNumberStr];
    }
    
    // Try each RPC URL until one succeeds
    for (let urlIndex = 0; urlIndex < RPC_URLS.length; urlIndex++) {
        const currentRpcUrl = RPC_URLS[urlIndex];
        
        const client = createPublicClient({
            chain: worldchain,
            transport: http(currentRpcUrl),
        });
        
        // Implement retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError;
        
        while (retryCount < maxRetries) {
            try {
                const block = await client.getBlock({
                    blockNumber: blockNumber
                });
                
                // Store in cache for future use
                blockTimestampCache[blockNumberStr] = block.timestamp;
                
                // If not the primary URL, log that we used a fallback
                if (urlIndex > 0) {
                    console.log(`Successfully used fallback RPC URL #${urlIndex + 1} for block ${blockNumberStr}`);
                }
                
                return block.timestamp;
                
            } catch (error) {
                lastError = error;
                retryCount++;
                
                // Exponential backoff: wait longer between each retry
                const backoffMs = 1000 * Math.pow(2, retryCount);
                console.log(`RPC request failed for block ${blockNumberStr} using RPC URL #${urlIndex + 1}, retrying in ${backoffMs}ms (${retryCount}/${maxRetries})`);
                await sleep(backoffMs);
            }
        }
        
        // If we've exhausted all retries for this URL, log and try the next URL
        if (urlIndex < RPC_URLS.length - 1) {
            console.log(`Failed with RPC URL #${urlIndex + 1} for block ${blockNumberStr}, switching to next fallback URL`);
        }
    }
    
    // If we get here, all URLs have failed
    console.error(`Failed to get timestamp for block ${blockNumberStr} after trying all ${RPC_URLS.length} RPC URLs`);
    throw new Error(`Could not retrieve block ${blockNumberStr} from any RPC endpoint after multiple attempts`);
}

export async function checkLoanStatus(timestamp: number, loan_term: number): Promise<boolean> {
    const timestampDate = new Date(timestamp * 1000);
    const currentDate = new Date();
    const diffInMilliseconds = Number(currentDate) - Number(timestampDate);
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    if (diffInDays >= loan_term) {
        return true;
    } else {
        return false;
    }
}
