import { QueryTypes } from 'sequelize';
import { getConnection, closeConnection } from '../init';
import { Env } from '../../config/interface';
import { UserResult } from '../../config/interface';

interface LendingHistoryResult {
    total_count: number;
    [key: string]: any;
}

export const getUserAuthentication = async (email: string, password: string, env: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env);
        
        // Set a timeout for query execution
        const queryPromise = connection.query<UserResult>(
            `select email, username, password_hash
            FROM mag_users
            join mag_user_roles on mag_users.user_id = mag_user_roles.user_id
            where mag_user_roles.role_id = 1
            AND mag_users.email = $1;
            `,
            {
                bind: [email],
                type: QueryTypes.SELECT
            }
        );
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 5000);
        });
        
        // Race between query and timeout
        const result = await Promise.race([queryPromise, timeoutPromise]) as UserResult[];

        // if (result.length === 0) {
        //     throw new Error('User not found');
        // }
        
        const user = result[0];
        return user;
    } catch (err) {
        console.error('Error querying user authentication:', err);
        throw err; // Re-throw the error to properly handle the Promise rejection
    } finally {
        // Always close the connection in a finally block
        if (connection) {
            await closeConnection(connection);
        }
    }
}

export const createUser = async (email: string, passwordHash: string, name?: string, env?: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env as Env);
        
        // Set a timeout for query execution
        const result = await connection.query(
            `WITH ins AS ( 
            INSERT INTO mag_users (email, password_hash, username)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO NOTHING
            RETURNING user_id, email 
            )
            SELECT user_id FROM ins;
            `,
            {
                bind: [email, passwordHash, name || null],
                type: QueryTypes.INSERT
            }
        );
        
        return result[0];
    } catch (err) {
        console.error('Error creating user:', err);
        throw err; // Re-throw to properly handle Promise rejection
    } finally {
        // Always close the connection in a finally block
        if (connection) {
            await closeConnection(connection);
        }
    }
}

export const getAllUsers = async (env: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env);
        const result = await connection.query(
            ` SELECT email, username, mag_users.user_id
              FROM mag_users
              LEFT JOIN mag_user_roles ON mag_users.user_id = mag_user_roles.user_id
              WHERE mag_user_roles.user_id IS NULL;
`,
            {
                type: QueryTypes.SELECT
            }
        );
        return result;
    } catch (err) {
        console.error('Error getting all users:', err);
        throw err;
    } finally { 
        if (connection) {
            await closeConnection(connection);
        }
    }
}

export const grantAdminAccess = async (userId: string, env: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env);
        const result = await connection.query(
            `INSERT INTO mag_user_roles (user_id, role_id) VALUES ($1, 1)`,
            { bind: [userId], type: QueryTypes.INSERT }
        );
    } catch(err) {
        console.error('Error granting admin access:', err);
        throw err;
    } finally {
        if (connection) {
            await closeConnection(connection);
        }
    }
}

export const saveWallet = async (wallet: string, notification: boolean, env: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env);
        const result = await connection.query(
            `INSERT INTO user_wallets (wallet, notification) VALUES ($1, $2)
             RETURNING *;
            `,
            { bind: [wallet, notification], type: QueryTypes.INSERT }
        ); 
        return result[0];
    } catch(err) {
        console.error('Error saving wallet:', err);
        throw err;
    } finally {
        if (connection) {
            await closeConnection(connection);
        }
    }
}

export const checkWallet = async (wallet: string, env: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env);
        const result = await connection.query(
            `SELECT id FROM user_wallets WHERE wallet = $1`,
            { bind: [wallet], type: QueryTypes.SELECT }
        );
        return result[0];
    } catch(err) {
        console.error('Error checking wallet:', err);
        throw err;
    } finally {
        if (connection) {
            await closeConnection(connection);
        }
    }
}   

export const getUserLendingHistory = async (wallet: string, page: number = 1, pageSize: number = 10, env: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env);
        const offset = (page - 1) * pageSize;
        const result = await connection.query<LendingHistoryResult>(
            `WITH total_count AS (
                SELECT COUNT(*) as count 
                FROM user_pool_lending 
                LEFT JOIN pool_addresses ON user_pool_lending.pool_id = pool_addresses.id
                WHERE user_pool_lending.address = $1
            )
            SELECT 
                (SELECT count FROM total_count) as total_count,
                user_pool_lending.address as address,
                user_pool_lending.eventname,
                user_pool_lending.shares,
                user_pool_lending.assets,
                user_pool_lending.timestamp,
                user_pool_lending.blocknumber,
                pool_addresses.address as pool_address,
                pool_addresses.name,
                pool_addresses.symbol
            FROM user_pool_lending 
            LEFT JOIN pool_addresses ON user_pool_lending.pool_id = pool_addresses.id
            WHERE user_pool_lending.address = $1
            ORDER BY timestamp DESC
            LIMIT $2 OFFSET $3`,
            { bind: [wallet, pageSize, offset], type: QueryTypes.SELECT }
        );
        return result;
    } catch(err) {
        console.error('Error getting user lending history:', err);
        throw err;
    } finally {
        if (connection) {
            await closeConnection(connection);
        }
    }
}

export const getPoolLpTokenPrice = async (poolAddress: string, env: Env) => {
    let connection = null;
    try {
        connection = await getConnection(env);
        const result = await connection.query(
            `SELECT pool_lp_tokens.token_price, pool_lp_tokens.timestamp, pool_lp_tokens.created_at      
            FROM pool_lp_tokens
            LEFT JOIN pool_addresses ON pool_addresses.id = pool_lp_tokens.pool_id
            WHERE pool_addresses.address = $1
            ORDER BY timestamp DESC`,
            { bind: [poolAddress], type: QueryTypes.SELECT }
        );
        return result;
    } catch(err) {
        console.error('Error getting pool lp token price:', err);
        throw err;
    } finally {
        if (connection) {
            await closeConnection(connection);
        }
    }
}
