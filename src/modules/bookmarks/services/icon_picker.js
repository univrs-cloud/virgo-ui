import Fuse from 'fuse.js';

const METADATA_URL = 'https://raw.githubusercontent.com/homarr-labs/dashboard-icons/refs/heads/main/metadata.json';
const ICON_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons@main';
const DEFAULT_ICON = '/assets/img/virgo.png';

const getIconUrl = (id, base) => `${ICON_BASE}/${base}/${id}.${base}`;
const MAX_RESULTS = 48;

let metadataPromise = null;
let fuse = null;
let iconList = [];

const isIconEntry = (value) => _.isObject(value) && _.has(value, 'base') && (value.base === 'svg' || value.base === 'png');

const fetchMetadata = () => {
	if (!metadataPromise) {
		metadataPromise = fetch(METADATA_URL)
			.then((res) => { return res.ok ? res.json() : {}; })
			.catch(() => { return {}; });
	}
	return metadataPromise;
};

const buildIconList = (raw) => {
	const list = [];
	_.each(_.keys(raw), (id) => {
		const entry = raw[id];
		if (!isIconEntry(entry)) {
			return;
		}
		const aliases = _.isArray(entry.aliases) ? entry.aliases.join(' ') : '';
		const categories = _.isArray(entry.categories) ? entry.categories.join(' ') : '';
		const searchText = [id, aliases, categories].filter(Boolean).join(' ');
		const colors = _.get(entry, 'colors');
		const hasLight = _.isObject(colors) && _.isString(colors.light);
		const hasDark = _.isObject(colors) && _.isString(colors.dark);
		if (hasLight && hasDark) {
			list.push({ id, base: entry.base, assetId: colors.light, searchText });
			list.push({ id, base: entry.base, assetId: colors.dark, searchText });
		} else if (hasLight) {
			list.push({ id, base: entry.base, assetId: colors.light, searchText });
		} else if (hasDark) {
			list.push({ id, base: entry.base, assetId: colors.dark, searchText });
		} else {
			list.push({ id, base: entry.base, assetId: id, searchText });
		}
	});
	return list;
};

const ensureIndex = async () => {
	if (fuse) {
		return;
	}
	const raw = await fetchMetadata();
	iconList = buildIconList(raw);
	fuse = new Fuse(iconList, {
		keys: ['searchText'],
		threshold: 0.3,
		includeScore: true
	});
};

const searchIcons = (query) => {
	if (!query || !query.trim()) {
		return _.slice(_.orderBy(iconList, [(o) => { return o.base === 'svg' ? 0 : 1; }], ['asc']), 0, MAX_RESULTS);
	}
	const results = fuse.search(query.trim());
	const ordered = _.orderBy(
		_.map(results, (r) => { return r.item; }),
		[(item) => { return item.base === 'svg' ? 0 : 1; }, (item, idx) => { return (results[idx]?.score ?? 1); }],
		['asc', 'asc']
	);
	return _.slice(ordered, 0, MAX_RESULTS);
};

export const getIconSrc = (icon) => {
	if (!icon) {
		return DEFAULT_ICON;
	}
	if (_.includes(icon, '/')) {
		return icon;
	}
	const dot = icon.lastIndexOf('.');
	const id = dot > 0 ? icon.slice(0, dot) : icon;
	const ext = (dot > 0 ? icon.slice(dot + 1) : 'svg').toLowerCase();
	if (ext !== 'svg' && ext !== 'png') {
		return getIconUrl(id, 'svg');
	}
	return getIconUrl(id, ext);
};

const renderResults = (results, resultsEl, onSelect) => {
	const fragment = document.createDocumentFragment();
	_.each(results, (item) => {
		const src = getIconUrl(item.assetId, item.base);
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'bookmark-icon-result-item';
		button.setAttribute('data-id', item.assetId);
		button.setAttribute('data-base', item.base);
		button.setAttribute('aria-label', item.id);
		const img = document.createElement('img');
		img.src = src;
		img.alt = '';
		img.width = 32;
		img.height = 32;
		button.appendChild(img);
		button.addEventListener('click', (e) => {
			e.stopPropagation();
			const value = `${item.assetId}.${item.base}`;
			onSelect(value, getIconUrl(item.assetId, item.base));
		});
		fragment.appendChild(button);
	});
	resultsEl.innerHTML = '';
	resultsEl.appendChild(fragment);
};

export const initIconSearch = (iconBox, iconPopoverContent, { getIconImgEl, getIconInputEl, onSelect }) => {
	ensureIndex();

	iconBox.addEventListener('shown.bs.popover', async () => {
		const popover = bootstrap.Popover.getInstance(iconBox);
		const tip = popover?.tip;
		if (!tip) {
			return;
		}
		const searchEl = tip.querySelector('.icon-search');
		const resultsEl = tip.querySelector('.bookmark-icon-results');
		if (!searchEl || !resultsEl) {
			return;
		}
		searchEl.focus();
		await ensureIndex();
		resultsEl.innerHTML = '';
		const onSelectCb = (iconValue, iconSrc) => {
			getIconImgEl().src = iconSrc;
			getIconInputEl().value = iconSrc;
			if (document.activeElement && tip.contains(document.activeElement)) {
				iconBox.focus();
			}
			onSelect?.();
			popover?.hide();
		};
		const runSearch = () => {
			const query = (searchEl.value ?? searchEl.querySelector('input')?.value) ?? '';
			if (!query.trim()) {
				resultsEl.innerHTML = '';
				return;
			}
			renderResults(searchIcons(query), resultsEl, onSelectCb);
		};
		searchEl.addEventListener('input', runSearch);
		searchEl.addEventListener('change', runSearch);
		// u-input may expose value on the component; try both
		const inputInside = tip.querySelector('.icon-search input');
		if (inputInside) {
			inputInside.addEventListener('input', runSearch);
		}
		resultsEl.addEventListener('wheel', (e) => {
			const { scrollTop, scrollHeight, clientHeight } = resultsEl;
			const canScrollUp = scrollTop > 0;
			const canScrollDown = scrollTop < scrollHeight - clientHeight;
			if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
				e.preventDefault();
				e.stopPropagation();
				resultsEl.scrollTop += e.deltaY;
			}
		}, { passive: false });
	});
};
