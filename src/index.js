import './index.scss';

window.account = JSON.parse(document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop() || '{}');
window.isAuthenticated = !_.isEmpty(account);
window.proxies = [];

Promise.allSettled([
	axios.get('/api/v1/proxies'),
	import('./js/header'),
	import('./js/main'),
	import('./js/footer')
])
	.then(([responseProxies]) => {
		if (responseProxies.status === 'fulfilled') {
			proxies = responseProxies.value.data;
		} 
		import('./js/account');
		import('./js/weather');
		import('./js/resources_monitor');
		import('./js/apps_bookmarks');
		import('./js/app_store');

		bootstrap.Tooltip.Default.container = 'body';
		bootstrap.Tooltip.Default.html = true;
		bootstrap.Tooltip.Default.sanitize = false;
		_.each(document.querySelectorAll('[data-bs-toggle="tooltip"]'), (element) => {
			new bootstrap.Tooltip(element);
		});		
	});
