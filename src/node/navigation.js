import page from 'page';
import { loadModule } from 'node/modules';
import { initNodeView } from 'node/view';
import * as softwareService from 'node/services/software';
import * as updateMode from 'libs/update_mode';

const UPDATE_PATH = '/system-update';
let hasEnteredUpdate = false;

const header = document.querySelector('header');
const offcanvas = document.querySelector('.offcanvas');
const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(offcanvas);

initNodeView();

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

const routePath = (ctx) => {
	return ctx.path.split('?')[0].split('#')[0];
};

const requiresNoUpdate = (ctx, next) => {
	if (updateMode.isActive() && routePath(ctx) !== UPDATE_PATH) {
		page.redirect(UPDATE_PATH);
		return;
	}

	next();
};

const showUpdate = async () => {
	const update = softwareService.getUpdate();
	if (update === -1 || _.isNull(update)) {
		page.redirect('/');
		return;
	}

	try {
		const updateView = await import(/* webpackPrefetch: true */ 'node/update');
		updateView.enter();
	} catch (error) {
		hasEnteredUpdate = false;
		notifier.add({ title: 'Could not open the update progress view.', type: 'error', duration: 0 });
		console.error('Error loading the update progress view:', error);
	}
};

const enterUpdate = (state) => {
	if (!isAdmin || state.update === -1 || _.isNull(state.update)) {
		return;
	}

	if (hasEnteredUpdate) {
		return;
	}

	hasEnteredUpdate = true;
	page(UPDATE_PATH);
};

const requiresAdmin = (ctx, next) => {
	if (!isAdmin) {
		page.redirect('/');
		return;
	}

	next();
};

header.addEventListener('click', navigate);
offcanvas.addEventListener('click', navigate);

const routes = [
	{ path: '/', module: 'dashboard' },
	{ path: '/dashboard', module: 'dashboard' },
	{ path: '/apps/:appName?', module: 'apps', middleware: [requireAuth, requiresAdmin] },
	{ path: '/shortcuts', module: 'shortcuts', middleware: [requireAuth, requiresAdmin] },
	{ path: '/folders', module: 'folders', middleware: [requireAuth, requiresAdmin] },
	{ path: '/time-machines', module: 'time-machines', middleware: [requireAuth, requiresAdmin] },
	{ path: '/users', module: 'users', middleware: [requireAuth, requiresAdmin] },
	{ path: '/storage', module: 'storage', middleware: [requireAuth, requiresAdmin] },
	{ path: '/network', module: 'network', middleware: [requireAuth, requiresAdmin] },
	{ path: '/settings', module: 'settings', middleware: [requireAuth, requiresAdmin] },
	{ path: '/system-services/:serviceUnit?', module: 'system-services', middleware: [requireAuth, requiresAdmin] },
	{ path: '/system-updates', module: 'system-updates', middleware: [requireAuth, requiresAdmin] },
	{ path: '/about', module: 'about', middleware: [requireAuth, requiresAdmin] },
	{ path: '/users/profile', module: 'profile', middleware: [requireAuth] }
];

// Catch all route, must be last
routes.push({ path: '*', module: 'not-found' });

page('*', requiresNoUpdate);
page(UPDATE_PATH, requireAuth, requiresAdmin, showUpdate);

_.each(routes, ({ path, module, middleware = [] }) => {
	page(path, ...middleware, async (ctx) => {
		ctx.module = module;
		await loadModule(module);
		showPage(ctx);
	});
});

page.start();

softwareService.subscribeToUpdate([enterUpdate]);
