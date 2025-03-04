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
        return next();
    } catch (error) {
        console.log(error);
        return new Response('Invalid token', { status: 401 });
    }
}

export async function userAuthentication(request: Request, env: Env): Promise<Response> {
    try {
        // Try to parse the JSON body
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
            return new Response(JSON.stringify({ error: 'Invalid JSON format in request body' }), { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const { email, password } = body as LoginCredentials;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const user = await getUserAuthentication(email, password, env);
        const payload = {
            success: false,
            auth_token: null,
            user: {
                email: user?.email || null,
                name: user?.name || null,
                isAdmin: false
            }
        }
        if (!user) {
            return new Response(JSON.stringify(payload), { 
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
                status: 401,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
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
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export async function userRegistration(request: Request, env: Env): Promise<Response> {
    try {
        // Try to parse the JSON body
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
            return new Response(JSON.stringify({ error: 'Invalid JSON format in request body' }), { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const { email, password, name } = body as RegisterCredentials;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Check if user already exists
        try {
            const existingUser = await getUserAuthentication(email, '', env);
            if (existingUser) {
                return new Response(JSON.stringify({ error: 'User with this email already exists' }), { 
                    status: 409,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Error checking user credentials: ', error);
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create new user in database
        const result = await createUser(email, passwordHash, name, env);
        
        if (!result) {
            return new Response(JSON.stringify({ error: 'Failed to create user' }), { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: email }, env.JWT_SECRET, { expiresIn: '15m' });

        return new Response(JSON.stringify({ auth_token: token }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error during user registration:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}