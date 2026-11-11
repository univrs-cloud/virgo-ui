const viewedNodeId = new URL(document.baseURI).pathname.match(/^\/nodes\/([^/]+)\//)?.[1] ?? null;
const STORAGE_KEY = (viewedNodeId ? `color-mode:${viewedNodeId}` : 'color-mode');
const root = document.documentElement;
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

const getColorMode = () => {
	try {
		const mode = localStorage.getItem(STORAGE_KEY);
		return (['light', 'dark'].includes(mode) ? mode : 'auto');
	} catch (error) {
		return 'auto';
	}
};

const applyColorMode = (mode) => {
	root.dataset.colorMode = mode;
	root.dataset.bsTheme = (mode === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : mode);
};

const setColorMode = (mode, origin) => {
	const update = () => {
		applyColorMode(mode);
		try {
			if (mode === 'auto') {
				localStorage.removeItem(STORAGE_KEY);
			} else {
				localStorage.setItem(STORAGE_KEY, mode);
			}
		} catch (error) {}
		document.querySelectorAll('.color-mode [data-color-mode]').forEach((option) => {
			option.classList.toggle('active', option.dataset.colorMode === mode);
		});
	};
	const theme = (mode === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : mode);
	if (!document.startViewTransition || theme === root.dataset.bsTheme) {
		update();
		return;
	}

	const rect = origin.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;
	const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
	document.startViewTransition(update).ready.then(() => {
		root.animate(
			{ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
			{ duration: 500, easing: 'ease-in-out', fill: 'forwards', pseudoElement: '::view-transition-new(root)' }
		);
	});
};

const select = (event) => {
	const option = event.target.closest('.color-mode [data-color-mode]');
	if (!option) {
		return;
	}

	event.preventDefault();
	event.stopPropagation();
	setColorMode(option.dataset.colorMode, option);
};

applyColorMode(getColorMode());
darkQuery.addEventListener('change', () => {
	if (root.dataset.colorMode === 'auto') {
		applyColorMode('auto');
	}
});
document.addEventListener('click', select, true);
