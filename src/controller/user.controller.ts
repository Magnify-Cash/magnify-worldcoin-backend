import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { apiResponse, errorResponse } from "../utils/apiResponse.utils";
import { LoginCredentials, RegisterCredentials } from "../config/interface";
import { getUserAuthentication, createUser, getAllUsers, grantAdminAccess } from "../database/queries/user.queries";
import { Env } from "../config/interface";
import { SALT_ROUNDS } from '../config/constant';

export async function loginController(request: Request, env: Env) {
    try {
        const body = await request.json();
        const { email, password } = body as LoginCredentials;   

        if (!email || !password) {
            return errorResponse(400, 'Email and password are required');
        }
        const user = await getUserAuthentication(email, password, env);
        if (!user) {
            return errorResponse(403, 'User is not an admin');
        } 
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return errorResponse(403, 'Invalid password');
        }
        const token = jwt.sign({ userId: user.email }, env.JWT_SECRET, { expiresIn: '24h' });
        const { password_hash, ...userWithoutPassword } = user; 
        return apiResponse(200, 'Login successful', { user: userWithoutPassword, auth_token: token });
    } catch (error) {
        return errorResponse(500, 'Internal server error');
    }
}

export async function registerController(request: Request, env: Env) {
    try {
        const body = await request.json();
        const { email, password, name } = body as RegisterCredentials;
        if (!email || !password) {
            return errorResponse(400, 'Email and password are required');
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await createUser(email, hashedPassword, name, env);
        if (!user) {
            return errorResponse(400, 'User already exists');
        }

        const token = jwt.sign({ userId: email }, env.JWT_SECRET, { expiresIn: '24h' });
        return apiResponse(200, 'User created successfully', {user, auth_token: token});
    } catch (error) {
        return errorResponse(500, 'Error creating user');
    }
}

export async function getUsersController(request: Request, env: Env) {
    try {
        const users = await getAllUsers(env);
        return apiResponse(200, 'Users fetched successfully', users);
    } catch (error) {
        return errorResponse(500, 'Error fetching user list');
    }
}

export async function grantAdminController(request: Request, env: Env) {
    try {
        const { userId } = await request.json() as { userId: string };
        await grantAdminAccess(userId, env);
        return apiResponse(200, 'Admin access granted successfully');
    } catch (error) {
        return errorResponse(500, 'Error granting admin access');
    }
}

export async function verifyAuthTokenController(request: Request, env: Env) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return errorResponse(401, 'Please provide a valid auth token');
        }
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        return apiResponse(200, 'Token verified successfully', { userId: decoded.userId });
    } catch (error) {
        return errorResponse(500, 'Error verifying auth token');
    }
}