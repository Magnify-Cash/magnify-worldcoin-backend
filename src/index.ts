import { Env, AuthRequest } from './config/interface';
import { saveWalletController, txHistoryController, sendWorldScanNotificationController, checkWalletController, verifyWorldUserController } from './controller/world.controller';
import { loginController, registerController, getUsersController, grantAdminController, verifyAuthTokenController } from './controller/user.controller';
import { apiResponse, errorResponse } from './utils/apiResponse.utils';
import { authMiddleware } from './middleware/auth.middleware';
import { getAnnouncementsController } from './controller/announcement.controller';
import { CORS_HEADERS } from './config/constant';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// Handle OPTIONS requests for CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: CORS_HEADERS
			});
		}

		switch (path) {
			case '/':
				return apiResponse(200, 'Welcome to Magnify!');
			case '/saveWallet':
				return saveWalletController(request, env);
			case '/getTransactionHistory':
				return txHistoryController(request, env);
			case '/sendNotification':
				return sendWorldScanNotificationController(request, env);
			case '/checkWallet':
				return checkWalletController(request, env);
			case '/login':
				return loginController(request, env);
			case '/register':
				return registerController(request, env);
			case '/users':
				return authMiddleware(request as AuthRequest, env, 
					() => getUsersController(request, env));
			case '/grantAdminAccess':
				return authMiddleware(request as AuthRequest, env, 
					() => grantAdminController(request, env));
			case '/verifyAuthToken':
				return verifyAuthTokenController(request, env);
			case '/verify':
				return verifyWorldUserController(request, env);
			case '/announcements':
				return authMiddleware(request as AuthRequest, env, 
					() => getAnnouncementsController(request, env));
			default:
				return errorResponse(404, 'Not Found');
		}
	},
} ;
//satisfies ExportedHandler<Env>;
