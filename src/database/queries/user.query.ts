import { QueryTypes } from 'sequelize';
import { getConnection, closeConnection } from "../index";

interface UserResult {
    email: string;
    password_hash: string;
    username: string;
}

interface Env {
    DATABASE_URL: string;
    NODE_ENV: string;
}

const getUserAuthentication = async (email: string, password: string, env: Env) => {
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
        const queryPromise = connection.query(
            `INSERT INTO mag_users (email, password_hash, username) VALUES ($1, $2, $3)`,
            {
                bind: [email, passwordHash, name || null],
                type: QueryTypes.INSERT
            }
        );
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 5000);
        });
        
        // Race between query and timeout
        await Promise.race([queryPromise, timeoutPromise]);
        
        return true;
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

export default getUserAuthentication;