import { Env } from './interface';

export const getConfig = (env: Env) => {
  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY,
    quickNodeUrl: env.QUICKNODE_RPC_URL || env.WORLDCHAIN_RPC_URL,
    jwtSecret: env.JWT_SECRET,
  };
};

export default getConfig;
