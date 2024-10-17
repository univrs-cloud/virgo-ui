import 'assets/scss/index.scss';
import * as bootstrapService from 'shell/services/bootstrap';

bootstrap.Tooltip.Default.container = 'body';
bootstrap.Tooltip.Default.html = true;
bootstrap.Tooltip.Default.sanitize = false;
bootstrap.Tooltip.Default.selector = '[data-bs-toggle="tooltip"]';
new bootstrap.Tooltip(document.querySelector('body'));

try {
	let encodedAccount = (document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop());
	let decodedAccountJson = atob(encodedAccount);
	window.account = JSON.parse(decodedAccountJson);
} catch (error) {
	window.account = {};
}
window.isAuthenticated = !_.isEmpty(account);

const render = (state) => {
	if (state.upgrade === -1) {
		return;
	}
	
	if (!isAuthenticated || _.isNull(state.upgrade)) {
		Promise.allSettled([
			import('shell/header'),
			import('shell/main')
		])
			.then(() => {
				import('modules');
			});
	} else {
		import('shell/upgrade');
	}

	bootstrapService.unsubscribe();
};

bootstrapService.subscribe([render]);
