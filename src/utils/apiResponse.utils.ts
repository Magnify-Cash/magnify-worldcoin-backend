import { CORS_HEADERS } from '../config/constant';

export const apiResponse = (
    status: number,
    message: string,
    data: any = []
) => {
    return new Response(JSON.stringify({ status, message, data }), {
        status,
        headers: CORS_HEADERS,
    });
};

export const errorResponse = (statusCode: number, message: string) => {
    return new Response(JSON.stringify({ status: statusCode, message }), {
        status: statusCode,
        headers: CORS_HEADERS,
    });
};


