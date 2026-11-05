const viewedNodeId = new URL(document.baseURI).pathname.match(/^\/nodes\/([^/]+)\//)?.[1] ?? null;
const STORAGE_KEY = (viewedNodeId ? `color-mode:${viewedNodeId}` : 'color-mode');

const getColorMode = () => {
	try {
		return (localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light');
	} catch (error) {
		return 'light';
	}
};

const setColorMode = (mode) => {
	document.documentElement.dataset.bsTheme = mode;
	try {
		if (mode === 'dark') {
			localStorage.setItem(STORAGE_KEY, mode);
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch (error) {}
};

const toggle = (event) => {
	if (!event.target.closest('.color-mode-switch')) {
		return;
	}

	setColorMode(event.target.checked ? 'dark' : 'light');
};

document.documentElement.dataset.bsTheme = getColorMode();
document.addEventListener('switch-changed', toggle);
