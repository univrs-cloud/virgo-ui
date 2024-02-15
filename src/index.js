import './index.scss';

window.account = JSON.parse(document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop() || '{}');
window.isAuthenticated = !_.isEmpty(account);

Promise.allSettled([
	import('./js/header'),
	import('./js/main'),
	import('./js/footer')
])
	.then(() => {
		import('./js/account');
		import('./js/weather');
		import('./js/resource_usage');
		import('./js/services_bookmarks');

		bootstrap.Tooltip.Default.container = 'body';
		bootstrap.Tooltip.Default.html = true;
		bootstrap.Tooltip.Default.sanitize = false;
		_.each(document.querySelectorAll('[data-bs-toggle="tooltip"]'), (element) => {
			new bootstrap.Tooltip(element);
		});		
	});
