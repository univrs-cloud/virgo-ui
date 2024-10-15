import 'index.scss';
import * as bootstrapService from 'js/services/bootstrap';

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
			import('js/header'),
			import('js/main')
		])
			.then(() => {
				import('js/power');
				import('js/resources_monitor');
				import('js/apps_bookmarks');
				import('js/shares');
				import('js/app_center');
				import('js/configuration');
			});
	} else {
		import('js/upgrade');
	}
	bootstrapService.unsubscribe();
};

bootstrapService.subscribe([render]);

window.addEventListener('scroll', () => {
	document.body.querySelector('.navbar-glass').classList[document.documentElement.scrollTop > 0 ? 'add' : 'remove']('navbar-glass-shadow');
});