import { Env, AuthRequest } from './config/interface';
import { saveWalletController, txHistoryController, sendWorldScanNotificationController, checkWalletController, verifyWorldUserController } from './controller/world.controller';
import { loginController, registerController, getUsersController, grantAdminController, verifyAuthTokenController } from './controller/user.controller';
import { apiResponse, errorResponse } from './utils/apiResponse.utils';
import { authMiddleware } from './middleware/auth.middleware';
import { getAnnouncementsController } from './controller/announcement.controller';
import { getSoulboundDataController, 
	previewDepositController, 
	previewMintController, 
	previewRedeemController, 
	previewWithdrawController, 
	soulboundTokenURIController, 
	totalAssetsController,
	getActiveLoanController,
	getLoanHistoryController,
	getAllActiveLoansController,
	getPoolActivationDateController,
	soulboundGetLoanHistoryDataController,
	soulboundGetLoanHistoryController,
	soulboundGetPoolAddressController,
	soulboundGetUserTokenIdController,
	getPoolLpSymbolController,
	getPoolTierController,
	totalSupplyController,
	getPoolTreasuryFeeController,
	getPoolLoanDurationController,
	getPoolLoanInterestRateController,
	getPoolStatusController,
	getUserMaxPoolDataController,
	getPoolLiquidityController,
	getPoolEndTimestampController,
	getPoolNameController,
	getPoolOriginationFeeController,
	getPoolLoanAmountController,
	getPoolWarmupDurationTestnetController,
	triggerProcessDefaultPoolController,
	getPoolUserLPBalanceController,
	handleDailyLpTokenPriceJob
 } from './controller/v3.controller';
import { getEthBalanceController, getUSDCBalanceController, getTokenMetadataController, getWalletTokenPortfolioController } from './controller/v3.controller';

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
			case '/soulbound/data':
				return getSoulboundDataController(request, env);
			case '/soulbound/uri':
				return soulboundTokenURIController(request, env);
			case '/soulbound/loan/history':
				return soulboundGetLoanHistoryController(request, env);
			case '/soulbound/loan/history/data':
				return soulboundGetLoanHistoryDataController(request, env);
			case '/soulbound/user/nft':
				return soulboundGetUserTokenIdController(request, env);
			case '/soulbound/pools/address':
				return soulboundGetPoolAddressController(request, env);
			case '/getEthBalance':
				return getEthBalanceController(request, env);
			case '/getUSDCBalance':
				return getUSDCBalanceController(request, env);
			case '/getTokenMetadata':
				return getTokenMetadataController(request, env);
			case '/getWalletTokens':
				return getWalletTokenPortfolioController(request, env);
			case '/v3/preview/mint':
				return previewMintController(request, env);
			case '/v3/preview/deposit':
				return previewDepositController(request, env);
			case '/v3/preview/withdraw':
				return previewWithdrawController(request, env);
			case '/v3/preview/redeem':
				return previewRedeemController(request, env);
			case '/v3/loan/active':
				return getActiveLoanController(request, env);
			case '/v3/loan/history':
				return getLoanHistoryController(request, env);
			case '/v3/loans':
				return getAllActiveLoansController(request, env);
			case '/v3/pool/name':
				return getPoolNameController(request, env);
			case '/v3/pool/activation':
				return getPoolActivationDateController(request, env);
			case '/v3/pool/deactivation':
				return getPoolEndTimestampController(request, env);
			case '/v3/pool/warmup':
				return getPoolWarmupDurationTestnetController(request, env);
			case '/v3/pool/symbol':
				return getPoolLpSymbolController(request, env);
			case '/v3/pool/tier':
				return getPoolTierController(request, env);
			case '/v3/pool/balance/usdc':
				return totalAssetsController(request, env);
			case '/v3/pool/balance/lp':
				return totalSupplyController(request, env);
			case '/v3/pool/fee/treasury':
				return getPoolTreasuryFeeController(request, env);
			case '/v3/pool/loan/duration':
				return getPoolLoanDurationController(request, env);
			case '/v3/pool/loan/interest':
				return getPoolLoanInterestRateController(request, env);
			case '/v3/pool/loan/amount':
				return getPoolLoanAmountController(request, env);
			case '/v3/pool/fee/origination':
				return getPoolOriginationFeeController(request, env);
			case '/v3/pool/status':
				return getPoolStatusController(request, env);
			case '/v3/pool/liquidity':
				return getPoolLiquidityController(request, env);
			case '/v3/user/max/data':
				return getUserMaxPoolDataController(request, env);
			case '/v3/user/lp/balance':
				return getPoolUserLPBalanceController(request, env);
			case '/v3/pool/getPrice':
				return handleDailyLpTokenPriceJob(env);
			default:
				return errorResponse(404, 'Not Found');
		}
	},
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log('Scheduled task executed');
		await handleDailyLpTokenPriceJob(env);
		await triggerProcessDefaultPoolController(env);
	}
} satisfies ExportedHandler<Env>;


// cron job calls process processOutdatedLoans()
// 24 hours