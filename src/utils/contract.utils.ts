import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Bytes, Hex, Hash } from 'ox';
import { ACTION_TO_TIER, Env, ClaimAction } from '../config/interface';
import { worldchain } from 'viem/chains';
import { V1_MAGNIFY_CONTRACT_ADDRESS } from '../config/constant';
import { WORLDCHAIN_RPC_URL } from '../config/constant';
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

//LoanRequested
//LoanRepaid
export async function getLoanV1() {
    try {
        let result = [];
        let openLoan = [];
        const client = createPublicClient({
            chain: worldchain,
            transport: http(WORLDCHAIN_RPC_URL),
        });

        const loanRequestedV1 = await client.getContractEvents({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: MagnifyV1Abi,
            eventName: 'LoanRequested',
            fromBlock: 1n,
            toBlock: 'latest'
        })
        const loanRequestArr = serializeBigInt(loanRequestedV1);
        const beforeCount = loanRequestArr.length;
        //console.log('before loanRequestArr: ', loanRequestArr.length);

        const loanRepaidV1 = await client.getContractEvents({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: MagnifyV1Abi,
            eventName: 'LoanRepaid',
            fromBlock: 8116813n,
            toBlock: 'latest'
        })
        const loanRepaidArr: LoanRepaid[] = serializeBigInt(loanRepaidV1);
        // console.log('length: ', loanRequestedV1.length);
        
        for (let i = 0; i < loanRequestArr.length; i++) {
            const item = loanRequestArr[i];
            let tokenRequestId = item.args.tokenId;
            
            for (let j = 0; j < loanRepaidArr.length; j++) {
                const repaidItem = loanRepaidArr[j];
                let repaidTokenRequestId = repaidItem.args.tokenId;
                
                if (repaidTokenRequestId === tokenRequestId) { 
                    if(repaidItem.blockNumber >= item.blockNumber) {
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
                        }  
                        result.push(obj);
                        loanRequestArr.splice(i, 1);   // [0,1,3,4]
                        loanRepaidArr.splice(j, 1);   // [0,1,2,3,4]
                        i--;
                        j--;
                        break;
                    }
                }
            }
        }

        const openLoanV1: LoanRequested[] = loanRequestArr;
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

        const loanRequestedV2 = await client.getContractEvents({
            address: env.V2_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
            abi: MagnifyV2Abi,
            eventName: 'LoanRequested',
            fromBlock: 1n,
            toBlock: 'latest'
        })
        const loanRequestedArr: LoanRequested[] = serializeBigInt(loanRequestedV2);

        const loanRepaidV2 = await client.getContractEvents({
            address: env.V2_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
            abi: MagnifyV2Abi,
            eventName: 'LoanRepaid',
            fromBlock: 1n,
            toBlock: 'latest'
        })
        const loanRepaidArr: LoanRepaid[] = serializeBigInt(loanRepaidV2);

        for (let i = 0; i < loanRequestedArr.length; i++) {
            const item = loanRequestedArr[i];
            let tokenRequestId = item.args.tokenId;
            
            for (let j = 0; j < loanRepaidArr.length; j++) {
                const repaidItem = loanRepaidArr[j];
                let repaidTokenRequestId = repaidItem.args.tokenId;

                if (repaidTokenRequestId === tokenRequestId) {
                    if(repaidItem.blockNumber >= item.blockNumber) {
                        let obj = {
                            user_wallet: item.args.borrower,
                            loan_amount: item.args.amount,
                            loan_repaid_amount: repaidItem.args.repaymentAmount,
                            loan_term: {
                                blockStart: item.blockNumber,
                                blockEnd: repaidItem.blockNumber
                            }
                        }
                        result.push(obj);
                        loanRequestedArr.splice(i, 1);
                        loanRepaidArr.splice(j, 1);
                        i--;
                        j--;
                        break;
                    }
                }
            }
        }
        return result;
    } catch (error) {
        console.log(error);
        return []
    }
}

