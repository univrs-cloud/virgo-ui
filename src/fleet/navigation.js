import page from 'page';

const header = document.querySelector('header');
const main = document.querySelector('main');

// Auth / MFA screens: each module exports mount(ctx) and renders a full-page card into <main>.
// The header carries no app chrome on these routes, so it's cleared first.
const showAuthScreen = (importer) => async (ctx) => {
	header.innerHTML = '';
	const screen = await importer();
	screen.mount(ctx);
};

// The authenticated app shell (header + modules) is built once, lazily on the first satisfied route
// — never on an auth screen — so the sites module isn't preloaded onto the wrong markup. Importing
// `fleet` (the registry) preloads sites, which mounts into `main .modules`, so it must run only
// after `fleet/main` has rendered that container.
let loadModule = null;
let appShell = null;
const ensureAppShell = () => {
	if (!appShell) {
		appShell = (async () => {
			await Promise.all([import('fleet/header'), import('fleet/main')]);
			const registry = await import('fleet');
			await registry.modulesLoaded;
			loadModule = registry.loadModule;
		})();
	}
	return appShell;
};

const showApp = (moduleName) => async (ctx) => {
	await ensureAppShell();
	ctx.module = moduleName;
	await loadModule(moduleName);
	const modules = main.querySelector('.modules');
	_.each(modules.querySelectorAll(':scope > div'), (element) => { element.classList.add('d-none'); });
	const moduleElement = modules.querySelector(`#${moduleName}`);
	moduleElement?.classList.remove('d-none');
	moduleElement?.onRoute?.(ctx);
};

// Guards read the globals index.js derives from the account cookie: isAuthenticated and account.mfa
// ('setup' | 'challenge' | undefined). mfaTarget() is where a given state belongs.
const mfaTarget = () => {
	if (account.mfa === 'setup') {
		return '/mfa/setup';
	}
	if (account.mfa === 'challenge') {
		return '/mfa/challenge';
	}
	return '/';
};

const guestOnly = (ctx, next) => {
	if (isAuthenticated) {
		page.redirect(mfaTarget());
		return;
	}
	next();
};

const requireSetup = (ctx, next) => {
	if (!isAuthenticated) {
		page.redirect('/signin');
		return;
	}
	if (account.mfa !== 'setup') {
		page.redirect(mfaTarget());
		return;
	}
	next();
};

const requireChallenge = (ctx, next) => {
	if (!isAuthenticated) {
		page.redirect('/signin');
		return;
	}
	if (account.mfa !== 'challenge') {
		page.redirect(mfaTarget());
		return;
	}
	next();
};

const requireSatisfied = (ctx, next) => {
	if (!isAuthenticated) {
		page.redirect('/signin');
		return;
	}
	if (account.mfa) {
		page.redirect(mfaTarget());
		return;
	}
	next();
};

const routes = [
	{ path: '/signin', middleware: [guestOnly], handler: showAuthScreen(() => import('fleet/signin')) },
	{ path: '/signup', middleware: [guestOnly], handler: showAuthScreen(() => import('fleet/signup')) },
	{ path: '/signup/confirm', middleware: [guestOnly], handler: showAuthScreen(() => import('fleet/confirm')) },
	{ path: '/mfa/setup', middleware: [requireSetup], handler: showAuthScreen(() => import('fleet/mfa_setup')) },
	{ path: '/mfa/challenge', middleware: [requireChallenge], handler: showAuthScreen(() => import('fleet/mfa_challenge')) },
	{ path: '/', middleware: [requireSatisfied], handler: showApp('sites') },
	{ path: '/users/profile', middleware: [requireSatisfied], handler: showApp('profile') },
	// Catch-all, must be last. Unknown paths land on not-found for a satisfied user, or bounce to
	// sign-in via the guard otherwise.
	{ path: '*', middleware: [requireSatisfied], handler: showApp('not-found') }
];

_.each(routes, ({ path, middleware = [], handler }) => {
	page(path, ...middleware, handler);
});

page.start();
