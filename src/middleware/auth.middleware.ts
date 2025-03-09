
import { apiResponse, errorResponse } from '../utils/apiResponse.utils';
import jwt from 'jsonwebtoken';
import { AuthRequest, Env } from '../config/interface';

export async function authMiddleware(request: AuthRequest, env: Env, next: () => Promise<Response>) {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return errorResponse(403, 'Unauthorized');
    }
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        if (!decoded) {
            return errorResponse(403, 'Unauthorized');
        }
        request.user = decoded;
        return await next();
    } catch (error) {
        return errorResponse(401, 'Error verifying token');
    }
}
