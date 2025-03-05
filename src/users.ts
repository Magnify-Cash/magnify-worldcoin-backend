import { getAllUsers, grantAdminAccess } from "./database/queries/user.query";
import jwt from 'jsonwebtoken';

interface Env {
    DATABASE_URL: string;
    NODE_ENV: string;
    JWT_SECRET: string;
}

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
};

export async function getUsersController(request: Request, env: Env): Promise<Response> {
    try {
        const users = await getAllUsers(env);
        return new Response(JSON.stringify(
            {
                success: true,
                data: users
            }
        ), { status: 200, headers });
    } catch (err) {
        console.error('Error: getUsersController', err);
        return new Response(JSON.stringify(
            { success: false, error: 'Internal Server Error' }
        ), { status: 404, headers });
    }
}

export async function grantAdminAccessController(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await request.json() as { userId: string };
        await grantAdminAccess(userId, env);
        return new Response(JSON.stringify(
            { success: true, message: 'Admin access granted' }
        ), { status: 200, headers });
        
    } catch (err) {
        console.error('Error: grantAdminAccessController', err);
        return new Response(JSON.stringify(
            { success: false, error: 'Internal Server Error' }
        ), { status: 404, headers });
    }
}

export async function verifyAuthTokenController(request: Request, env: Env): Promise<Response> {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return new Response(JSON.stringify({ success: false, error: 'No token provided' }), { status: 404, headers });
        }
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        return new Response(JSON.stringify({ success: true, userId: decoded.userId }), { status: 200, headers });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: 'Token is not valid' }), { status: 408, headers });
    }
}