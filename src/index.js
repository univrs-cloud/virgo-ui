import 'assets/scss/index.scss';
import 'libs/lodash';
import 'libs/dialog';
import * as bootstrapService from 'shell/services/bootstrap';

bootstrap.Tooltip.Default.container = 'body';
bootstrap.Tooltip.Default.html = true;
bootstrap.Tooltip.Default.sanitize = false;
bootstrap.Tooltip.Default.selector = '[data-bs-toggle="tooltip"]';
bootstrap.Modal.Default.backdrop = 'static';
bootstrap.Modal.Default.keyboard = false;
bootstrap.Modal.Default.focus = false;
new bootstrap.Tooltip(document.querySelector('body'));

window.addEventListener('beforeunload', (event) => {
	bootstrapService.disconnectSocket();
});
document.addEventListener('visibilitychange', (event) => {
	if (document.visibilityState === 'visible') {
		bootstrapService.reconnectSocket();
	}
});
document.addEventListener('shown.bs.modal', (event) => {
	event.target.querySelector('input:not([type="hidden"])')?.focus(); // focus 1st input after modal is shown
});
document.addEventListener('click', (event) => {
	if (!event.target.classList.contains('password-toggle')) {
		return;
	}

	event.preventDefault();
	const types = { text: 'password', password: 'text' };
	const input = event.target.closest('.form-floating').querySelector('input');
	input.type = types[input.type];
	input.focus();
});

try {
	let encodedAccount = (document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop());
	let decodedAccountJson = atob(encodedAccount);
	window.account = JSON.parse(decodedAccountJson);
} catch (error) {
	window.account = {};
}
window.isAuthenticated = !_.isEmpty(account);
window.isAdmin = isAuthenticated && _.includes(account.groups, 'admins');

const render = async (state) => {
	const isSetupRequired = bootstrapService.checkIfSetupIsRequired(state);
	if (_.isNull(isSetupRequired) || state.update === -1) {
		return;
	}
	
	bootstrapService.unsubscribe();

	if (isSetupRequired) {
		await import('shell/setup');
	} else if (isAuthenticated && isAdmin && !_.isNull(state.update)) {
		await import('shell/update');
	} else {
		try {
			await Promise.allSettled([
				import('shell/header'),
				import('shell/main')
			]);
			const { modulesLoaded } = await import('modules');
			await modulesLoaded;
			await import('shell/navigation');
		} catch (error) {
			alert(`Error during application initialization<br><br>${error}`, );
			console.error('Error during application initialization:', error);
		}
	}
};

bootstrapService.subscribe([render]);
