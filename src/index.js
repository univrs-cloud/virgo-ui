import 'assets/scss/index.scss';
import 'libs/lodash';
import 'libs/bootstrap';
import 'libs/dialog';
import 'libs/components';
import * as runtimeService from 'shell/services/runtime';
import * as accountShell from 'shell/account';

function loadAccount() {
	try {
		const encoded = document.cookie.match(/(?:^|;\s*)account=([^;]+)/)?.[1];
		if (!encoded) {
			return {};
		}
		return JSON.parse(atob(decodeURIComponent(encoded)));
	} catch {
		return {};
	}
}

async function launchShell() {
	await Promise.all([
		import('shell/header'),
		import('shell/main')
	]);
	const { modulesLoaded } = await import('modules');
	await modulesLoaded;
	import('shell/navigation');
}

async function bootstrapApp() {
	if (isFleetMode && isAuthenticated) {
		await import('stores/node');
	}

	if (isFleetMode && !runtimeService.getSelectedNodeId()) {
		try {
			await launchShell();
		} catch (error) {
			console.error('Error during application initialization:', error);
		}
		return;
	}

	const bootstrapService = await import('shell/services/bootstrap');

	let unsubscribe;

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
				await launchShell();
			} catch (error) {
				console.error('Error during application initialization:', error);
			}
		}
	};

	unsubscribe = bootstrapService.subscribe([render]);
}

function start() {
	window.notifier = document.querySelector('u-notifier');

	runtimeService.subscribe([(state) => {
		if (!state.role) {
			return;
		}

		window.isFleetMode = runtimeService.isFleetMode();
		window.account = loadAccount();
		window.isAuthenticated = !_.isEmpty(account);
		// There is no fleet-wide admin: in fleet mode, a node's system pages are available
		// to anyone with access to that node, so isAdmin simply reflects whether a node is
		// currently selected. Outside fleet mode, it still reflects real OS admin group membership.
		window.isAdmin = isAuthenticated && (isFleetMode ? Boolean(runtimeService.getSelectedNodeId()) : _.includes(account.groups, 'admins'));

		accountShell.init();

		if (isFleetMode && !isAuthenticated) {
			import('shell/login');
			return;
		}

		bootstrapApp().catch((error) => {
			console.error('Failed to initialize application:', error);
		});
	}]);
}

start();
