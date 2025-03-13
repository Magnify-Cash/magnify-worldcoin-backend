import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Bytes, Hex, Hash } from 'ox';
import { ACTION_TO_TIER, Env, ClaimAction } from '../config/interface';
import { worldchain } from 'viem/chains';
import { V1_MAGNIFY_CONTRACT_ADDRESS } from '../config/constant';
import { WORLDCHAIN_RPC_URL_V3 as WORLDCHAIN_RPC_URL } from '../config/constant';
import MagnifyV1Abi from '../config/contracts/MagnifyV1.json';
import MagnifyV2Abi from '../config/contracts/MagnifyV2.json';
import { checkLoanStatus, getBlockTimestamp } from './block.utils';
import { LoanRepaid, LoanRequested } from '../config/interface';
import { convertTimestampToDate } from './common.utils';



export async function getContractAddress(env: Env) {
    const contractAddresses = [
        V1_MAGNIFY_CONTRACT_ADDRESS, 
        String(env.V2_MAGNIFY_CONTRACT_ADDRESS || '').trim()
      ].map(addr => addr.toLowerCase());
      return contractAddresses;
}


export async function mintNFT(action: ClaimAction, signal: `0x${string}`, tokenId: string, env: Env) {
    try {

        let privateKey = String(env.PRIVATE_KEY || '').trim();

        if (!privateKey) {
            throw new Error('PRIVATE_KEY is undefined or empty after sanitization');
        }

        if (!privateKey.startsWith('0x')) {
            privateKey = `0x${privateKey}`;
        }

        if (privateKey.length !== 66) {
            throw new Error(`Invalid PRIVATE_KEY length: expected 66 characters, got ${privateKey.length}`);
        }


        const account = privateKeyToAccount(privateKey as Hex.Hex);

        const client = createWalletClient({
            account,
            chain: worldchain,
            transport: http(WORLDCHAIN_RPC_URL),
        });


        const tier = ACTION_TO_TIER[action];
        
        const hash = await client.writeContract({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: [
                action.startsWith('mint')
                    ? {
                            name: 'mintNFT',
                            type: 'function',
                            stateMutability: 'nonpayable',
                            inputs: [
                                { name: 'to', type: 'address' },
                                { name: 'tierId', type: 'uint256' },
                            ],
                            outputs: [],
                        }
                    : {
                            name: 'upgradeNFT',
                            type: 'function',
                            stateMutability: 'nonpayable',
                            inputs: [
                                { name: 'tokenId', type: 'uint256' },
                                { name: 'newTierId', type: 'uint256' },
                            ],
                            outputs: [],
                        },
            ],
            functionName: action.startsWith('mint') ? 'mintNFT' : 'upgradeNFT',
            args: action.startsWith('mint') ? [signal as `0x${string}`, BigInt(tier)] : [BigInt(tokenId!), BigInt(tier)],
        });
        return hash;

    } catch (err) {
        console.error(err);    
        return null;
    }
}


// Helper function to convert BigInt values to strings
function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }
    
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            result[key] = serializeBigInt(obj[key]);
        }
        return result;
    }
    
    return obj;
}

// Define the interface for the parameters
interface ContractEventParams {
    address: `0x${string}`;
    abi: any;
    eventName: string;
    fromBlock: bigint | string;
    toBlock: bigint | string | 'latest';
}

// Helper function to get events with pagination to avoid "eth_getLogs is limited to a 10,000 range" error
async function getContractEventsWithPagination(
    client: any, 
    params: ContractEventParams
): Promise<any[]> {
    try {
        // Get the latest block number
        const latestBlock = await client.getBlockNumber();
        
        // Set chunk size (must be under 10,000 blocks to avoid the RPC limit)
        const CHUNK_SIZE = 9000n;
        
        // Convert fromBlock to bigint
        const fromBlock = typeof params.fromBlock === 'string' ? 1n : params.fromBlock;
        const toBlock = params.toBlock === 'latest' ? latestBlock : params.toBlock;
        
        let currentFromBlock = fromBlock;
        let allEvents: any[] = [];
        
        // Loop until we've covered the entire range
        while (currentFromBlock <= toBlock) {
            // Calculate the end block for this chunk
            const currentToBlock = (currentFromBlock + CHUNK_SIZE) > toBlock 
                ? toBlock 
                : (currentFromBlock + CHUNK_SIZE - 1n);
            
            try {
                console.log(`Fetching events from block ${currentFromBlock} to ${currentToBlock}`);
                
                // Get events for this chunk
                const events = await client.getContractEvents({
                    ...params,
                    fromBlock: currentFromBlock,
                    toBlock: currentToBlock
                });
                
                // Add events to the result array
                allEvents = [...allEvents, ...events];
                
            } catch (error) {
                console.error(`Error fetching events from block ${currentFromBlock} to ${currentToBlock}:`, error);
                // If the chunk is still too large, we can implement further subdivision here
            }
            
            // Move to the next chunk
            currentFromBlock = currentToBlock + 1n;
        }
        
        return allEvents;
    } catch (error) {
        console.error("Error in getContractEventsWithPagination:", error);
        return [];
    }
}

//LoanRequested
//LoanRepaid
export async function getLoanData(contractAddress: string, version: string) {
    try {
        let result = [];
        let openLoan = [];
        const client = createPublicClient({
            chain: worldchain,
            transport: http(WORLDCHAIN_RPC_URL),
        });

        // Use the paginated function instead of directly calling getContractEvents
        const loanRequestedV1 = await getContractEventsWithPagination(client, {
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: MagnifyV1Abi,
            eventName: 'LoanRequested',
            fromBlock: 1n,
            toBlock: 'latest'
        });
        const loanRequestArr: LoanRequested[] = serializeBigInt(loanRequestedV1);
        const beforeCount = loanRequestArr.length;

        // Use the paginated function for loan repaid events
        const loanRepaidV1 = await getContractEventsWithPagination(client, {
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: MagnifyV1Abi,
            eventName: 'LoanRepaid',
            fromBlock: 8116813n,
            toBlock: 'latest'
        });
        const loanRepaidArr: LoanRepaid[] = serializeBigInt(loanRepaidV1);
        
        // Check for duplicates in loanRequestArr
        const uniqueRequestLoans = new Map<string, LoanRequested>();
        for (const loan of loanRequestArr) {
            const key = `${loan.args.tokenId}_${loan.blockNumber}`;
            if (!uniqueRequestLoans.has(key)) {
                uniqueRequestLoans.set(key, loan);
            } else {
                console.log(`Duplicate loan request found for token ${loan.args.tokenId} at block ${loan.blockNumber}`);
            }
        }
        const dedupedLoanRequestArr = Array.from(uniqueRequestLoans.values());
        console.log(`Removed ${loanRequestArr.length - dedupedLoanRequestArr.length} duplicate loan requests`);
        
        // Check for duplicates in loanRepaidArr
        const uniqueRepaidLoans = new Map<string, LoanRepaid>();
        for (const loan of loanRepaidArr) {
            const key = `${loan.args.tokenId}_${loan.blockNumber}`;
            if (!uniqueRepaidLoans.has(key)) {
                uniqueRepaidLoans.set(key, loan);
            } else {
                console.log(`Duplicate loan repayment found for token ${loan.args.tokenId} at block ${loan.blockNumber}`);
            }
        }
        const dedupedLoanRepaidArr = Array.from(uniqueRepaidLoans.values());
        console.log(`Removed ${loanRepaidArr.length - dedupedLoanRepaidArr.length} duplicate loan repayments`);
        
        // Create a map of repaid loans indexed by token ID for O(1) lookups
        const repaidLoansMap: Record<string, LoanRepaid> = {};
        for (const repaidLoan of dedupedLoanRepaidArr) {
            if (!repaidLoansMap[repaidLoan.args.tokenId]) {
                repaidLoansMap[repaidLoan.args.tokenId] = repaidLoan;
            }
        }
        
        // Process loan requests with O(n) complexity
        const processedTokenIds = new Set<string>();
        for (const item of dedupedLoanRequestArr) {
            const tokenRequestId = item.args.tokenId;
            const repaidItem = repaidLoansMap[tokenRequestId];
            
            if (repaidItem && repaidItem.blockNumber >= item.blockNumber) {
                // This loan has been repaid
                processedTokenIds.add(tokenRequestId);
                
                const startTimestamp = await getBlockTimestamp(BigInt(item.blockNumber));
                const endTimestamp = await getBlockTimestamp(BigInt(repaidItem.blockNumber));
                
                let obj = {
                    user_wallet: item.args.borrower,
                    loan_amount: item.args.amount,
                    loan_repaid_amount: repaidItem.args.repaymentAmount,
                    loan_term: parseInt(item.args.amount) === 10000000 ? 60 : 30,
                    time_loan_started: convertTimestampToDate(serializeBigInt(startTimestamp)),
                    time_loan_ended: convertTimestampToDate(serializeBigInt(endTimestamp)),
                    is_defaulted: false,
                    version: version
                };
                console.log('obj: ', obj);
                
                result.push(obj);
            }
        }
        
        // Process open loans (loans not in processedTokenIds)
        const openLoanV1 = dedupedLoanRequestArr.filter((loan: LoanRequested) => !processedTokenIds.has(loan.args.tokenId));
        for(let i = 0; i < openLoanV1.length; i++) {
            const item = openLoanV1[i];
            const loanTerm = parseInt(item.args.amount) === 10000000 ? 60 : 30;
            const timestamp = await getBlockTimestamp(BigInt(item.blockNumber));
            const startTimestamp = serializeBigInt(timestamp);
            const isDefaulted = await checkLoanStatus(startTimestamp, loanTerm);
            const openLoanObj = {
                user_wallet: item.args.borrower,
                loan_amount: item.args.amount,
                loan_repaid_amount: "",
                loan_term: parseInt(item.args.amount) === 10000000 ? 60 : 30,
                time_loan_started: convertTimestampToDate(startTimestamp),
                time_loan_ended: "",
                is_defaulted: isDefaulted,
                version: version
            }
            console.log('openLoanObj: ', openLoanObj);
            openLoan.push(openLoanObj);
        }
        // console.log('timestamp: ', serializeBigInt(timestamp));
        // Convert BigInt values to strings before returning
       // return serializeBigInt(loanRepaidV1);
    //    const afterCount = loanRequestArr.length;
    //    console.log('after loanRequestArr: ', loanRequestArr.length);
    //    console.log('diff: ', beforeCount - afterCount);
    //    //console.log('defaultedLoan: ', loan);
    //    console.log('loanRepaidCount ', result.length);
        //console.log('result: ', result.concat(openLoan));
        return result.concat(openLoan);
    } catch (err) {
        console.log(err);
        return [];
    }
}

export async function getLoanV2(env: Env) {
    let result = [];
    try {
        const client = createPublicClient({
            chain: worldchain,
            transport: http(WORLDCHAIN_RPC_URL),
        });

        // Use the paginated function for V2 loan request events
        const loanRequestedV2 = await getContractEventsWithPagination(client, {
            address: env.V2_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
            abi: MagnifyV2Abi,
            eventName: 'LoanRequested',
            fromBlock: 1n,
            toBlock: 'latest'
        });
        const loanRequestedArr: LoanRequested[] = serializeBigInt(loanRequestedV2);

        // Use the paginated function for V2 loan repaid events
        const loanRepaidV2 = await getContractEventsWithPagination(client, {
            address: env.V2_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
            abi: MagnifyV2Abi,
            eventName: 'LoanRepaid',
            fromBlock: 1n,
            toBlock: 'latest'
        });
        const loanRepaidArr: LoanRepaid[] = serializeBigInt(loanRepaidV2);

        // Check for duplicates in loanRequestArr
        const uniqueRequestLoans = new Map<string, LoanRequested>();
        for (const loan of loanRequestedArr) {
            const key = `${loan.args.tokenId}_${loan.blockNumber}`;
            if (!uniqueRequestLoans.has(key)) {
                uniqueRequestLoans.set(key, loan);
            } else {
                console.log(`Duplicate loan request found for token ${loan.args.tokenId} at block ${loan.blockNumber}`);
            }
        }
        const dedupedLoanRequestArr = Array.from(uniqueRequestLoans.values());
        console.log(`Removed ${loanRequestedArr.length - dedupedLoanRequestArr.length} duplicate loan requests in V2`);
        
        // Check for duplicates in loanRepaidArr
        const uniqueRepaidLoans = new Map<string, LoanRepaid>();
        for (const loan of loanRepaidArr) {
            const key = `${loan.args.tokenId}_${loan.blockNumber}`;
            if (!uniqueRepaidLoans.has(key)) {
                uniqueRepaidLoans.set(key, loan);
            } else {
                console.log(`Duplicate loan repayment found for token ${loan.args.tokenId} at block ${loan.blockNumber}`);
            }
        }
        const dedupedLoanRepaidArr = Array.from(uniqueRepaidLoans.values());
        console.log(`Removed ${loanRepaidArr.length - dedupedLoanRepaidArr.length} duplicate loan repayments in V2`);

        // Create a map of repaid loans indexed by token ID for O(1) lookups
        const repaidLoansMap: Record<string, LoanRepaid> = {};
        for (const repaidLoan of dedupedLoanRepaidArr) {
            if (!repaidLoansMap[repaidLoan.args.tokenId]) {
                repaidLoansMap[repaidLoan.args.tokenId] = repaidLoan;
            }
        }
        
        // Process loan requests with O(n) complexity
        for (const item of dedupedLoanRequestArr) {
            const tokenRequestId = item.args.tokenId;
            const repaidItem = repaidLoansMap[tokenRequestId];
            
            if (repaidItem && repaidItem.blockNumber >= item.blockNumber) {
                const startTimestamp = await getBlockTimestamp(BigInt(item.blockNumber));
                const endTimestamp = await getBlockTimestamp(BigInt(repaidItem.blockNumber));
                
                let obj = {
                    user_wallet: item.args.borrower,
                    loan_amount: item.args.amount,
                    loan_repaid_amount: repaidItem.args.repaymentAmount,
                    loan_term: parseInt(item.args.amount) === 10000000 ? 60 : 30,
                    time_loan_started: convertTimestampToDate(serializeBigInt(startTimestamp)),
                    time_loan_ended: convertTimestampToDate(serializeBigInt(endTimestamp)),
                    is_defaulted: false,
                };
                
                result.push(obj);
            }
        }
        
        return result;
    } catch (error) {
        console.log(error);
        return []
    }
}

