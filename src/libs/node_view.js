import page from 'page';

const FLEET_PATH_PREFIX = '/nodes';

const getNodeViewBase = () => {
	return window.location.pathname.match(/^(\/nodes\/[^/]+)/)?.[1] ?? null;
};

const getNodeViewId = () => {
	return getNodeViewBase()?.split('/').pop() ?? null;
};

const isFleetPath = (path) => {
	return path === FLEET_PATH_PREFIX || path.startsWith(`${FLEET_PATH_PREFIX}/`);
};

const initNodeView = () => {
	const base = getNodeViewBase();
	if (!base) {
		return;
	}

	page.base(base);

	document.addEventListener('click', (event) => {
		if (event.defaultPrevented || event.button !== 0) {
			return;
		}
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}

		const link = event.target.closest('a[href]');
		if (!link) {
			return;
		}

		const href = link.getAttribute('href');
		if (!href || href.startsWith('#')) {
			return;
		}

		if (link.rel?.includes('external') || link.target === '_blank') {
			return;
		}

		let url;
		try {
			url = new URL(href, window.location.origin);
		} catch {
			return;
		}

		if (url.origin !== window.location.origin) {
			return;
		}

		const path = url.pathname;
		if (path.startsWith(base) || isFleetPath(path) || !path.startsWith('/')) {
			return;
		}

		event.preventDefault();
		page(`${path}${url.search}${url.hash}`);
	});
};

export {
	getNodeViewBase,
	getNodeViewId,
	initNodeView
};
