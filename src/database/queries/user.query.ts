import { QueryTypes } from 'sequelize';
import sequelize from "../index";

interface UserResult {
    email: string;
    password_hash: string;
}

const getUserAuthentication = async (email: string, password: string) => {
    try {
        const result = await sequelize.query<UserResult>(`
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

export default getUserAuthentication;