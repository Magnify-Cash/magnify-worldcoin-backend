import { QueryTypes } from 'sequelize';
import sequelize, { getConnection } from "../index";

interface UserResult {
    email: string;
    password_hash: string;
}

interface Env {
    DATABASE_URL: string;
    NODE_ENV: string;
}

const getUserAuthentication = async (email: string, password: string, env: Env) => {
    try {
        const result = await getConnection(env).query<UserResult>(`
            SELECT [email], [password_hash] FROM mag_users WHERE [email] = :email   
            `, {
            replacements: { email },
            type: QueryTypes.SELECT
        })

        if (result.length === 0) {
            throw new Error('User not found');
        }

        const user = result[0];
        return user;
    } catch (err) {
        console.error('Error querying user authentication:', err);
    }
}

export const createUser = async (email: string, passwordHash: string, name?: string, env?: Env) => {
    try {
        const connection = getConnection(env as Env);
        const result = await connection.query(`
            INSERT INTO mag_users ([email], [password_hash], [username], [created_at]) 
            VALUES (:email, :passwordHash, :name, GETDATE())
        `, {
            replacements: { 
                email, 
                passwordHash,
                name: name || null 
            },
            type: QueryTypes.INSERT
        });

        return true;
    } catch (err) {
        console.error('Error creating user:', err);
        return false;
    }
}

export default getUserAuthentication;