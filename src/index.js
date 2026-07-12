import 'assets/scss/index.scss';
import 'libs/lodash';
import 'libs/bootstrap';
import 'libs/dialog';
import 'libs/components';
import * as runtimeService from 'shell/services/runtime';

try {
	let encodedAccount = (document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop());
	let decodedAccountJson = atob(encodedAccount);
	window.account = JSON.parse(decodedAccountJson);
} catch (error) {
	window.account = {};
}
window.isAuthenticated = !_.isEmpty(account);
window.isAdmin = isAuthenticated && _.includes(account.groups, 'admins');
window.notifier = document.querySelector('u-notifier');
window.runtimeRole = null;

const render = async (state) => {
	if (_.isNull(state.setupCompleted) || state.update === -1) {
		return;
	}
	
	unsubscribe?.();
	unsubscribe = null;

	if (state.setupCompleted === false) {
		await import('shell/setup');
	} else if (isAdmin && !_.isNull(state.update)) {
		await import('shell/update');
	} else {
		try {
			await Promise.all([
				import('shell/header'),
				import('shell/main')
			]);
			const { modulesLoaded } = await import('modules');
			await modulesLoaded;
			import('shell/navigation');
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

	const onNodeView = /^\/nodes\/[^/]+\//.test(new URL(document.baseURI).pathname);
	if (runtimeRole === 'fleet') {
		if (onNodeView) {
			if (isAuthenticated) {
				isAdmin = true;
			}
		} else {
			if (!isAuthenticated) {
				await import('fleet/login');
			} else {
				try {
					await Promise.all([
						import('fleet/header'),
						import('fleet/main')
					]);
					const { modulesLoaded } = await import('fleet');
					await modulesLoaded;
					import('fleet/navigation');
				} catch (error) {
					alert(`Error during application initialization<br><br>${error}`, );
					console.error('Error during application initialization:', error);
				}
			}
			return;
		}
	}

	const bootstrapService = await import('shell/services/bootstrap');
	unsubscribe = bootstrapService.subscribe([render]);
};

let unsubscribe = runtimeService.subscribe([runtime]);
