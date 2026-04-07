import Fuse from 'fuse.js';

const DEFAULT_OPTIONS = {
	threshold: 0.35,
	ignoreLocation: true
};

/**
 * Fuzzy-filter a list by search query. Empty query returns the list unchanged.
 * @param {object[]} list
 * @param {string} query
 * @param {string[]} keys field paths to match against
 * @param {object} [options] extra matcher options
 * @returns {object[]}
 */
export const filterListByQuery = (list, query, keys, options = {}) => {
	const q = (query || '').trim();
	if (!q) {
		return list;
	}
	if (!list?.length) {
		return list ?? [];
	}
	const fuse = new Fuse(list, {
		keys,
		...DEFAULT_OPTIONS,
		...options
	});
	return _.map(fuse.search(q), (r) => { return r.item; });
};
