import 'assets/scss/index.scss';
import 'libs/lodash';
import * as bootstrapService from 'shell/services/bootstrap';
import page from 'page';

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
	let types = { text: 'password', password: 'text' };
	let input = event.target.closest('.form-floating').querySelector('input');
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
	if (state.upgrade === -1 || _.isNull(isSetupRequired)) {
		return;
	}
	
	if (isSetupRequired) {
		await import('shell/setup');
	} else if (isAuthenticated && isAdmin && !_.isNull(state.upgrade)) {
		await import('shell/upgrade');
	} else {
		try {
			await Promise.allSettled([
				import('shell/header'),
				import('shell/main')
			]);
			const { modulesLoaded } = await import('modules');
			await modulesLoaded;
		} catch (error) {
			console.error('Error during application initialization:', error);
		}
	}

	page.start({ hashbang: true });
	bootstrapService.unsubscribe();
};

bootstrapService.subscribe([render]);
