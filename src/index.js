import 'assets/scss/index.scss';
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

const render = async (state) => {
	if (state.upgrade === -1) {
		return;
	}
	
	if (!isAuthenticated || _.isNull(state.upgrade)) {
		try {
			await Promise.allSettled([
				import('shell/header'),
				import('shell/main')
			]);
			const { modulesLoaded } = await import('modules');
			await modulesLoaded;
			page.start({ hashbang: true });
		} catch (error) {
			console.error('Error during application initialization:', error);
		}
	} else {
		await import('shell/upgrade');
	}

	bootstrapService.unsubscribe();
};

bootstrapService.subscribe([render]);
