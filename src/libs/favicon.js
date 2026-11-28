import faviconImage from 'assets/img/favicon.svg';

const MARKS = {
	dot: '<circle cx="82" cy="82" r="18" fill="currentColor"/>',
	check: '<path d="M69 85l8 8 17-18" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>',
	cross: '<path d="M74 74l20 20M94 74l-20 20" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round"/>'
};

const link = document.querySelector('link[rel="icon"]');
const originalHref = link?.getAttribute('href');
let currentKey = null;

const setBadge = (badge) => {
	if (!link) {
		return;
	}

	const key = (badge ? `${badge.color}:${badge.darkColor}:${badge.mark}` : null);
	if (key === currentKey) {
		return;
	}

	currentKey = key;
	if (!badge) {
		link.setAttribute('href', originalHref);
		return;
	}

	const style = getComputedStyle(document.documentElement);
	const color = style.getPropertyValue(`--${badge.color}`).trim();
	const darkColor = style.getPropertyValue(`--${badge.darkColor || badge.color}`).trim();
	const image = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>.mark{color:${color}}@media (prefers-color-scheme:dark){.mark{color:${darkColor}}}</style>${faviconImage}<g class="mark">${MARKS[badge.mark]}</g></svg>`;
	link.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(image)}`);
};

export {
	setBadge
};
