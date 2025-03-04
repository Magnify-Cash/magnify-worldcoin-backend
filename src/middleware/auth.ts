import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getUserAuthentication, { createUser } from '../database/queries/user.query';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterCredentials extends LoginCredentials {
    name?: string;
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
        return await next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return new Response('Invalid token', { status: 401 });
    }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), ms)
        ),
    ]);
}

export async function userAuthentication(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json();
        const { email, password } = body as LoginCredentials;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), { 
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Authenticating user:', email);
        const user = await withTimeout(getUserAuthentication(email, password, env), 5000);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = jwt.sign({ userId: user.email }, env.JWT_SECRET, { expiresIn: '15m' });
        return new Response(JSON.stringify({ auth_token: token }), { 
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error during user authentication:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function userRegistration(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json();
        const { email, password, name } = body as RegisterCredentials;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), { 
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Checking if user exists:', email);
        const existingUser = await withTimeout(getUserAuthentication(email, '', env), 5000);
        if (existingUser) {
            return new Response(JSON.stringify({ error: 'User with this email already exists' }), { 
                status: 409, headers: { 'Content-Type': 'application/json' }
            });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        console.log('Creating user:', email);
        const result = await withTimeout(createUser(email, passwordHash, name, env), 5000);
        if (!result) {
            return new Response(JSON.stringify({ error: 'Failed to create user' }), { 
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = jwt.sign({ userId: email }, env.JWT_SECRET, { expiresIn: '15m' });
        return new Response(JSON.stringify({ auth_token: token }), {
            status: 201, headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error during user registration:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}