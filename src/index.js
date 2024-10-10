import 'index.scss';
import * as bootstrapService from 'js/services/bootstrap';

bootstrap.Tooltip.Default.container = 'body';
bootstrap.Tooltip.Default.html = true;
bootstrap.Tooltip.Default.sanitize = false;
bootstrap.Tooltip.Default.selector = '[data-bs-toggle="tooltip"]';
new bootstrap.Tooltip(document.querySelector('body'));

window.account = JSON.parse(document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop() || '{}');
window.isAuthenticated = !_.isEmpty(account);

const render = (state) => {
	if (state.upgrade === -1) {
		return;
	}

	if (!isAuthenticated || _.isNull(state.upgrade)) {
		Promise.allSettled([
			import('js/header'),
			import('js/main'),
			import('js/footer')
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
