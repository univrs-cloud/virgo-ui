import 'assets/scss/index.scss';
import 'libs/lodash';
import 'libs/bootstrap';
import 'libs/dialog';
import 'libs/components';
import * as runtimeService from 'libs/services/runtime';
import { forNode, isAvailable } from 'libs/webrtc_transport';

try {
	let encodedAccount = (document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop());
	let decodedAccountJson = atob(encodedAccount);
	window.account = JSON.parse(decodedAccountJson);
} catch (error) {
	window.account = {};
}
window.isAuthenticated = !_.isEmpty(account);
window.isAdmin = isAuthenticated && _.includes(account.groups, 'admins');
window.runtimeRole = null;

const viewedNodeId = new URL(document.baseURI).pathname.match(/^\/nodes\/([^/]+)\//)?.[1] ?? null;
const onNodeView = Boolean(viewedNodeId);
if (onNodeView && isAuthenticated && isAvailable()) {
	forNode(viewedNodeId).catch((error) => {});
}

const render = async (state) => {
	if (_.isNull(state.setupCompleted) || state.update === -1) {
		return;
	}
	
	unsubscribe?.();
	unsubscribe = null;

	if (state.setupCompleted === false) {
		try {
			await import('setup/main');
			await import('setup/navigation');
		} catch (error) {
			alert(`Error during application initialization<br><br>${error}`, );
			console.error('Error during application initialization:', error);
		}
	} else if (location.pathname === '/login') {
		if (isAuthenticated) {
			location.replace('/');
			return;
		}

		await import('node/login');
	} else if (isAdmin && !_.isNull(state.update)) {
		await import('node/update');
	} else {
		try {
			await Promise.all([
				import('node/jobs'),
				import('node/header'),
				import('node/main'),
				import('node/power')
			]);
			const { modulesLoaded } = await import('node/modules');
			await modulesLoaded;
			await import('node/navigation');
		} catch (error) {
			alert(`Error during application initialization<br><br>${error}`, );
			console.error('Error during application initialization:', error);
		}
	}
};

const runtime = async (state) => {
	if (_.isNull(state.role)) {
		return;
	}

	runtimeRole = state.role;
	unsubscribe?.();
	unsubscribe = null;

	if (runtimeRole === 'fleet') {
		// Push notifications are a fleet-only concern: register the service worker (and silently
		// re-subscribe an already-opted-in install) here so the node role never installs a worker.
		if (isAuthenticated) {
			import('fleet/services/push').then((pushService) => { pushService.init(); }).catch((error) => {});
		}
		if (onNodeView) {
			import('libs/node_asset_bridge').then((assetBridge) => { assetBridge.start(viewedNodeId); }).catch((error) => {});
		}
		if (!onNodeView) {
			if (process.env.NODE_ENV === 'production') {
				await import('fleet/services/analytics').catch((error) => {});
			}
			// Every fleet screen (auth, MFA, app) is page-routed; the router's guards redirect based
			// on isAuthenticated + account.mfa and lazily build the app shell for satisfied routes.
			try {
				await import('fleet/navigation');
			} catch (error) {
				alert(`Error during application initialization<br><br>${error}`, );
				console.error('Error during application initialization:', error);
			}
			return;
		}
	}

	const bootstrapService = await import('libs/services/bootstrap');
	unsubscribe = bootstrapService.subscribe([render]);
};

let unsubscribe = runtimeService.subscribe([runtime]);
