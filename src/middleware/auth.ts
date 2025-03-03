import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import getUserAuthentication from '../database/queries/user.query';

interface LoginCredentials {
    email: string;
    password: string;
}

interface Env {
    DATABASE_URL: string;
    NODE_ENV: string;
    JWT_SECRET: string;
}

export interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

type NextFunction = () => Promise<Response>;

export async function verifyAuthToken(request: AuthRequest, next: NextFunction, env: Env): Promise<Response> {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        request.user = decoded;
        return next();
    } catch (error) {
        console.log(error);
        return new Response('Invalid token', { status: 401 });
    }
}

export async function userAuthentication(request: Request, env: Env): Promise<Response> {
    const body = await request.json();
    const { email, password } = body as LoginCredentials;

    try {
        if (!email || !password) {
            return new Response('Email and password are required', { status: 400 });
        }

        const user = await getUserAuthentication(email, password, env);
        if (!user) {
            return new Response('Invalid credentials', { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return new Response('Invalid credentials', { status: 401 });
        }

        const token = jwt.sign({ userId: user.email }, env.JWT_SECRET, { expiresIn: '15m' });

        return new Response(JSON.stringify({ auth_token: token }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error during user authentication:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}