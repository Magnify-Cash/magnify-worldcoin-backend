import { getAllUsers, grantAdminAccess } from "./database/queries/user.query";

interface Env {
    DATABASE_URL: string;
    NODE_ENV: string;
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
        console.error('Error getting all users:', err);
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
        console.error('Error granting admin access:', err);
        return new Response(JSON.stringify(
            { success: false, error: 'Internal Server Error' }
        ), { status: 404, headers });
    }
}