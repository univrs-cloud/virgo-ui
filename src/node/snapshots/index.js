import snapshotsPartial from 'node/snapshots/partials/snapshots.html';
import * as snapshotService from 'node/snapshots/services/snapshot';
import { getNodeViewBase } from 'node/view';
import 'node/snapshots/browse';
import 'node/snapshots/restore';

const snapshotsTemplate = _.template(snapshotsPartial);
const cards = {};
const selections = {};
const filters = {};
const searches = {};
const results = {};

const renderSnapshots = (key, options) => {
	cards[key] = options;
	return snapshotsTemplate({
		key,
		snapshots: options.snapshots,
		icon: options.icon || null,
		browse: options.browse || null,
		actions: options.actions || (() => { return ''; }),
		selectedSnapshot: selections[key],
		snapshotFilter: filters[key] || {},
		snapshotSearching: Boolean(searches[key]),
		snapshotResults: results[key] || null,
		canDownloadSnapshotFiles: !getNodeViewBase(),
		prettyBytes,
		moment
	});
};

const clearSnapshots = (isCleared) => {
	_.each([cards, selections, filters, searches, results], (state) => {
		_.each(_.filter(_.keys(state), isCleared), (key) => {
			delete state[key];
		});
	});
};

const findCard = (key) => {
	return document.querySelector(`.snapshot-timeline[data-snapshot-key="${CSS.escape(key)}"]`);
};

const rerender = (key) => {
	const card = findCard(key);
	if (!card || !cards[key]) {
		return;
	}

	morphdom(card, renderSnapshots(key, cards[key]));
};

const keyOf = (element) => {
	return element?.closest('.snapshot-timeline')?.dataset?.snapshotKey;
};

const selectSnapshot = (event) => {
	const target = event.target.closest('[data-snapshot]');
	const key = keyOf(target);
	if (!key) {
		return;
	}

	selections[key] = target.dataset.snapshot;
	rerender(key);
};

const scrubSnapshot = (event) => {
	if (!event.target.classList?.contains('snapshot-scrubber')) {
		return;
	}

	const key = keyOf(event.target);
	if (!key) {
		return;
	}

	const keys = event.target.dataset.keys.split(',');
	const positions = _.map(event.target.dataset.positions.split(','), Number);
	const value = event.target.value / 1000;
	const index = _.minBy(_.range(keys.length), (i) => { return Math.abs(positions[i] - value); });
	selections[key] = keys[index];
	rerender(key);
};

const stepSnapshot = (event) => {
	if (!event.target.classList?.contains('snapshot-scrubber')) {
		return;
	}

	const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1, Home: -Infinity, End: Infinity }[event.key];
	const key = keyOf(event.target);
	if (!step || !key) {
		return;
	}

	event.preventDefault();
	const keys = event.target.dataset.keys.split(',');
	const index = _.clamp(_.indexOf(keys, event.target.dataset.selected) + step, 0, keys.length - 1);
	selections[key] = keys[index];
	rerender(key);
};

const runSearch = async (key, query, append) => {
	const previous = (append ? results[key] : null);
	searches[key] = true;
	rerender(key);
	let result;
	try {
		const response = await snapshotService.searchSnapshots(query);
		if (response?.status === 'succeeded') {
			result = { query, results: [...(previous?.results || []), ...response.results], hasMore: response.hasMore };
		} else {
			result = { query, results: previous?.results || [], hasMore: previous?.hasMore || false, message: response?.message || 'Search failed.' };
		}
	} catch (error) {
		result = { query, results: previous?.results || [], hasMore: previous?.hasMore || false, message: error.message };
	}

	if (!cards[key]) {
		return;
	}

	results[key] = result;
	delete searches[key];
	rerender(key);
	if (!append) {
		const input = findCard(key)?.querySelector('.snapshot-search');
		await input?.updateComplete;
		input?.focus();
	}
};

const submitSearch = async (key, value) => {
	const term = _.trim(value);
	if (!term || searches[key]) {
		return false;
	}

	const filter = filters[key] || {};
	const sizes = {
		small: { maxSize: 1048575 },
		medium: { minSize: 1048576, maxSize: 104857599 },
		large: { minSize: 104857600, maxSize: 1073741823 },
		huge: { minSize: 1073741824 }
	};
	const days = { '1d': 1, '7d': 7, '30d': 30, '365d': 365 };
	const query = { term, ...sizes[filter.size] };
	if (cards[key]?.browse?.root) {
		query.path = cards[key].browse.root;
	}
	if (filter.type) {
		query.type = filter.type;
	}
	if (filter.state) {
		query.state = filter.state;
	}
	if (days[filter.modified]) {
		query.since = moment().subtract(days[filter.modified], 'days').toISOString();
	}

	await runSearch(key, query, false);
	return true;
};

const filterSnapshots = async (event) => {
	const option = event.target.closest('[data-snapshot-filter]');
	const key = keyOf(option);
	if (!key) {
		return;
	}

	const { snapshotFilter, value } = option.dataset;
	const term = findCard(key)?.querySelector('.snapshot-search')?.value;
	filters[key] = (snapshotFilter === 'clear' ? {} : { ...filters[key], [snapshotFilter]: value });
	if (!await submitSearch(key, term)) {
		rerender(key);
	}
};

const searchSnapshots = async (event) => {
	if (!event.target.classList?.contains('snapshot-search') || _.toLower(event.key) !== 'enter') {
		return;
	}

	const key = keyOf(event.target);
	if (key) {
		await submitSearch(key, event.target.value);
	}
};

const loadMoreSnapshots = async (event) => {
	const key = keyOf(event.target.closest('.snapshot-search-more'));
	const current = results[key];
	if (!current || searches[key]) {
		return;
	}

	await runSearch(key, { ...current.query, offset: _.size(current.results) }, true);
};

const clearSearch = (event) => {
	const button = event.target.closest('.snapshot-search-clear');
	const key = keyOf(button);
	if (!key) {
		return;
	}

	delete results[key];
	delete filters[key];
	const input = findCard(key)?.querySelector('.snapshot-search');
	if (input) {
		input.value = '';
	}
	rerender(key);
};

const releaseDownload = (event) => {
	event.target.closest('.snapshot-timeline a[download]')?.blur();
};

document.addEventListener('click', releaseDownload);
document.addEventListener('click', loadMoreSnapshots);
document.addEventListener('click', clearSearch);
document.addEventListener('click', selectSnapshot);
document.addEventListener('click', filterSnapshots);
document.addEventListener('input', scrubSnapshot);
document.addEventListener('keydown', stepSnapshot);
document.addEventListener('keydown', searchSnapshots);

export {
	renderSnapshots,
	clearSnapshots
};
