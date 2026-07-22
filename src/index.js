import 'assets/scss/index.scss';
import 'libs/lodash';
import 'libs/bootstrap';
import 'libs/dialog';
import 'libs/components';
import * as runtimeService from 'libs/services/runtime';

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

const render = async (state) => {
	if (_.isNull(state.setupCompleted) || state.update === -1) {
		return;
	}
	
	unsubscribe?.();
	unsubscribe = null;

	if (state.setupCompleted === false) {
		await import('setup/main');
	} else if (isAdmin && !_.isNull(state.update)) {
		await import('node/update');
	} else {
		try {
			await Promise.all([
				import('node/header'),
				import('node/main')
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
		const onNodeView = /^\/nodes\/[^/]+\//.test(new URL(document.baseURI).pathname);
		if (!onNodeView) {
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
