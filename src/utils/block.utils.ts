import { createPublicClient } from "viem";
import { worldchain } from "viem/chains";
import { WORLDCHAIN_RPC_URL } from "../config/constant";
import { http } from "viem";

// Cache to store previously fetched timestamps
const blockTimestampCache: Record<string, bigint> = {};

// Helper for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getBlockTimestamp(blockNumber: bigint): Promise<bigint> {
    const blockNumberStr = blockNumber.toString();
    
    // Check if we have this block timestamp in cache
    if (blockTimestampCache[blockNumberStr]) {
        return blockTimestampCache[blockNumberStr];
    }
    
    const client = createPublicClient({
        chain: worldchain,
        transport: http(WORLDCHAIN_RPC_URL),
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
            return block.timestamp;
            
        } catch (error) {
            lastError = error;
            retryCount++;
            
            // Exponential backoff: wait longer between each retry
            const backoffMs = 1000 * Math.pow(2, retryCount);
            console.log(`RPC request failed for block ${blockNumberStr}, retrying in ${backoffMs}ms (${retryCount}/${maxRetries})`);
            await sleep(backoffMs);
        }
    }
    
    console.error(`Failed to get timestamp for block ${blockNumberStr} after ${maxRetries} retries`);
    throw lastError;
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
