import page from 'page';

const showPage = (ctx) => {
	const module = ctx.params.module || 'dashboard';

	_.each(container.querySelectorAll('.nav-link.active'), (element) => { element.classList.remove('active'); });
	_.each(container.querySelectorAll(`.nav-link[href="/${module}"]`), (element) => { element.classList.add('active'); });

	_.each(document.querySelectorAll('.modules > div'), (element) => { element.classList.add('d-none') });
	document.querySelector(`#${module}`)?.classList.remove('d-none');
};

const navigate = (event) => {
	const navLink = event.target.closest('.nav-link');
	if (_.isNull(navLink)) {
		return;
	}

	const offcanvas = navLink.closest('.offcanvas');
	if (!_.isNull(offcanvas)) {
		bootstrap.Offcanvas.getInstance(offcanvas)?.hide();
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

const container = document.querySelector('header');
container.addEventListener('click', navigate);

const routes = [
	{ path: '/', module: 'dashboard' },
	{ path: '/dashboard', module: 'dashboard' },
	{ path: '/apps', module: 'apps', middleware: [requireAuth, requiresAdmin] },
	{ path: '/bookmarks', module: 'bookmarks', middleware: [requireAuth, requiresAdmin] },
	{ path: '/folders', module: 'folders', middleware: [requireAuth, requiresAdmin] },
	{ path: '/time-machines', module: 'time-machines', middleware: [requireAuth, requiresAdmin] },
	{ path: '/users', module: 'users', middleware: [requireAuth, requiresAdmin] },
	{ path: '/storage', module: 'storage', middleware: [requireAuth, requiresAdmin] },
	{ path: '/network', module: 'network', middleware: [requireAuth, requiresAdmin] },
	{ path: '/settings', module: 'settings', middleware: [requireAuth, requiresAdmin] },
	{ path: '/system-services', module: 'system-services', middleware: [requireAuth, requiresAdmin] },
	{ path: '/system-update', module: 'system-update', middleware: [requireAuth, requiresAdmin] },
	{ path: '/about', module: 'about', middleware: [requireAuth, requiresAdmin] },
	{ path: '/users/profile', module: 'profile', middleware: [requireAuth] },
	{ path: '*', module: 'not-found' },
];

_.each(routes, ({ path, module, middleware = [] }) => {
	page(path, ...middleware, () => { showPage({ params: { module } }); } );
});

page.start();
