import page from 'page';
import { loadModule } from 'modules';
import * as runtimeService from 'shell/services/runtime';
import * as systemService from 'shell/services/system';

const header = document.querySelector('header');
const offcanvas = document.querySelector('.offcanvas');
const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(offcanvas);

const showPage = (ctx) => {
	const module = ctx.module || 'dashboard';

	_.each(document.querySelectorAll(':is(header, .offcanvas) .nav-link.active'), (element) => { element.classList.remove('active'); });
	_.each(document.querySelectorAll(`:is(header, .offcanvas) .nav-link[href="/${module}"]`), (element) => { element.classList.add('active'); });
	
	_.each(document.querySelectorAll('.modules > div'), (element) => { element.classList.add('d-none') });
	
	const moduleElement = document.querySelector(`#${module}`);
	moduleElement?.classList.remove('d-none');
	moduleElement?.onRoute?.(ctx);
};

const navigate = (event) => {
	const navLink = event.target.closest('.nav-link');
	if (_.isNull(navLink)) {
		return;
	}

	if (!_.isNull(navLink.closest('.offcanvas'))) {
		offcanvasInstance?.hide();
	}
};

const requireAuth = (ctx, next) => {
	if (!isAuthenticated) {
		page.redirect('/');
		return;
	}

	next();
};

const requiresAdmin = (ctx, next) => {
	if (!isAdmin) {
		page.redirect('/');
		return;
	}

	next();
};

const requiresFleetMode = (ctx, next) => {
	if (!isFleetMode) {
		page.redirect('/');
		return;
	}

	next();
};

const requiresFleetSites = async (ctx, next) => {
	if (!isFleetMode || runtimeService.getSelectedNodeId()) {
		next();
		return;
	}

	const sites = await systemService.getSites();
	if (sites.length) {
		next();
		return;
	}

	ctx.module = 'fleet-empty';
	await loadModule('fleet-empty');
	showPage(ctx);
};

header.addEventListener('click', navigate);
offcanvas.addEventListener('click', navigate);

const routes = [
	{ path: '/', module: 'dashboard', middleware: [requiresFleetSites] },
	{ path: '/dashboard', module: 'dashboard', middleware: [requiresFleetSites] },
	{ path: '/sites', module: 'sites', middleware: [requireAuth, requiresFleetMode] },
	{ path: '/apps/:appName?', module: 'apps', middleware: [requireAuth, requiresAdmin] },
	{ path: '/bookmarks', module: 'bookmarks', middleware: [requireAuth, requiresAdmin] },
	{ path: '/folders', module: 'folders', middleware: [requireAuth, requiresAdmin] },
	{ path: '/time-machines', module: 'time-machines', middleware: [requireAuth, requiresAdmin] },
	{ path: '/users', module: 'users', middleware: [requireAuth, requiresAdmin] },
	{ path: '/storage', module: 'storage', middleware: [requireAuth, requiresAdmin] },
	{ path: '/network', module: 'network', middleware: [requireAuth, requiresAdmin] },
	{ path: '/settings', module: 'settings', middleware: [requireAuth, requiresAdmin] },
	{ path: '/system-services/:serviceUnit?', module: 'system-services', middleware: [requireAuth, requiresAdmin] },
	{ path: '/system-updates', module: 'system-updates', middleware: [requireAuth, requiresAdmin] },
	{ path: '/about', module: 'about', middleware: [requireAuth, requiresAdmin] },
	{ path: '/users/profile', module: 'profile', middleware: [requireAuth] },
	{ path: '*', module: 'not-found' },
];

_.each(routes, ({ path, module, middleware = [] }) => {
	page(path, ...middleware, async (ctx) => {
		ctx.module = module;
		await loadModule(module);
		showPage(ctx);
	});
});

page.start();
