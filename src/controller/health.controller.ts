import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { Env } from '../config/interface';
import { getConfig } from '../config';
import { apiResponse, errorResponse } from '../utils/apiResponse.utils';

export async function healthCheckController(request: Request, env: Env) {
  try {
    const config = getConfig(env);
    
    // Ensure we have required values
    if (!config.supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }
    
    if (!config.supabaseKey) {
      throw new Error('Missing SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
    
    if (!config.quickNodeUrl) {
      throw new Error('Missing QUICKNODE_RPC_URL or WORLDCHAIN_RPC_URL environment variable');
    }
    
    // Initialize Supabase client
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Initialize ethers provider
    const provider = new ethers.JsonRpcProvider(config.quickNodeUrl);
    
    // Check Supabase connection
    const { data, error } = await supabase.from('mag_users').select('*').limit(1);
    
    // Check RPC connection
    const blockNumber = await provider.getBlockNumber();
    
    return apiResponse(200, 'Service is healthy', {
      supabase: {
        status: error ? 'fail' : 'ok',
        usersSample: data || []
      },
      rpc: {
        status: 'ok',
        latestBlock: blockNumber.toString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Health check failed:', errorMessage);
    return errorResponse(500, 'Service is not healthy');
  }
}
