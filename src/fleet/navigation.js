import page from 'page';
import { loadModule } from 'fleet';

const modules = document.querySelector('main .modules');

const showPage = (ctx) => {
	const module = ctx.module || 'sites';

	_.each(modules.querySelectorAll(':scope > div'), (element) => { element.classList.add('d-none'); });

	const moduleElement = modules.querySelector(`#${module}`);
	moduleElement?.classList.remove('d-none');
	moduleElement?.onRoute?.(ctx);
};

const routes = [
	{ path: '/', module: 'sites' },
	{ path: '/users/profile', module: 'profile' }
];

// Catch all route, must be last
routes.push({ path: '*', module: 'not-found' });

_.each(routes, ({ path, module }) => {
	page(path, async (ctx) => {
		ctx.module = module;
		await loadModule(module);
		showPage(ctx);
	});
});

page.start();
