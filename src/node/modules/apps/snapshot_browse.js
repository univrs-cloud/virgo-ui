import modalPartial from 'node/modules/apps/partials/modals/snapshot_browser.html';
import browserPartial from 'node/modules/apps/partials/modals/snapshot_browser_content.html';
import * as appService from 'node/modules/apps/services/app';
import { getNodeViewBase } from 'node/view';

const ROOT = '';
const ROOT_NAME = 'Nextcloud';
const DATA_PREFIX = '/data/';
const CHANGES_PAGE = 500;
const DOWNLOAD_URL = '/snapshots/download';
const USER_ROOT_DEPTH = 4;

const browserTemplate = _.template(browserPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', modalPartial);

const module = document.querySelector('#apps');
const modal = document.querySelector('#snapshot-browser');
let state = null;

const parentOf = (path) => {
	if (_.some(state.listings[ROOT]?.folders, { path })) {
		return ROOT;
	}

	return path.slice(0, path.lastIndexOf('/'));
};

const childrenOf = (path) => {
	const listing = state.listings[path];
	if (!listing) {
		return null;
	}

	return _.concat(
		_.map(listing.folders, (folder) => { return { ...folder, isDir: true }; }),
		_.map(listing.files, (file) => { return { ...file, isDir: false }; })
	);
};

const findItem = (path) => {
	return _.find(childrenOf(parentOf(path)), { path }) || null;
};

const isInside = (path, folder) => {
	return _.startsWith(path, `${folder}/`);
};

const folderOf = (path) => {
	return path.slice(0, path.lastIndexOf('/'));
};

const isExcluded = (path) => {
	return _.some(_.keys(state.excluded), (excluded) => { return excluded === path || isInside(path, excluded); });
};

const isCovered = (path) => {
	return !isExcluded(path) && _.some(_.keys(state.selected), (selected) => { return selected === path || isInside(path, selected); });
};

const hasSelectedInside = (path) => {
	return _.some(_.keys(state.selected), (selected) => { return isInside(selected, path); });
};

const hasExcludedInside = (path) => {
	return _.some(_.keys(state.excluded), (excluded) => { return isInside(excluded, path); });
};

const isFull = (item) => {
	return isCovered(item.path) && !hasExcludedInside(item.path);
};

const fetchListing = async (session, path) => {
	if (session.listings[path]) {
		return;
	}

	const response = await appService.browseSnapshot({ snapshot: session.snapshot, path });
	if (response?.status !== 'succeeded') {
		throw new Error(response?.message || 'Could not load the folder.');
	}
	session.listings[path] = { folders: response.folders, files: response.files, isIndexed: response.isIndexed, isDeleted: response.isDeleted, movedTo: response.movedTo };
};

const foldersBetween = async (session, from, to) => {
	const folders = [];
	let folder = from;
	while (folder !== to) {
		try {
			await fetchListing(session, folder);
		} catch (error) {
			session.error = error.message;
			return null;
		}
		folders.push(folder);
		const next = _.find(childrenOf(folder), (child) => { return child.path === to || isInside(to, child.path); });
		if (!next) {
			return null;
		}
		folder = next.path;
	}
	return folders;
};

const select = async (item) => {
	const session = state;
	if (session.excluded[item.path]) {
		delete session.excluded[item.path];
		return;
	}

	const excluded = _.find(_.keys(session.excluded), (path) => { return isInside(item.path, path); });
	if (excluded) {
		const folders = await foldersBetween(session, excluded, item.path);
		if (!folders) {
			return;
		}

		delete session.excluded[excluded];
		_.each(folders, (folder) => {
			_.each(childrenOf(folder), (child) => {
				if (child.path !== item.path && !isInside(item.path, child.path)) {
					session.excluded[child.path] = child;
				}
			});
		});
		return;
	}

	session.excluded = _.omitBy(session.excluded, (value, path) => { return isInside(path, item.path); });
	if (isCovered(item.path)) {
		return;
	}

	session.selected = _.omitBy(session.selected, (value, path) => { return isInside(path, item.path); });
	session.selected[item.path] = item;
	const parent = parentOf(item.path);
	const siblings = childrenOf(parent);
	if (parent === ROOT || !siblings || !_.every(siblings, isFull)) {
		return;
	}

	const folder = findItem(parent);
	if (folder) {
		await select(folder);
	}
};

const deselect = (item) => {
	if (state.selected[item.path]) {
		delete state.selected[item.path];
		state.excluded = _.omitBy(state.excluded, (value, path) => { return isInside(path, item.path); });
		return;
	}

	const ancestor = _.find(_.keys(state.selected), (path) => { return isInside(item.path, path); });
	if (!ancestor || !isCovered(item.path)) {
		return;
	}

	state.excluded = _.omitBy(state.excluded, (value, path) => { return isInside(path, item.path); });
	state.excluded[item.path] = item;
	let parent = folderOf(item.path);
	while (_.every(childrenOf(parent) || [null], (child) => { return child && state.excluded[child.path]; })) {
		const folder = (parent === ancestor ? state.selected[ancestor] : findItem(parent));
		if (!folder) {
			return;
		}

		state.excluded = _.omitBy(state.excluded, (value, path) => { return folderOf(path) === folder.path; });
		if (parent === ancestor) {
			delete state.selected[ancestor];
			return;
		}

		state.excluded[parent] = folder;
		parent = folderOf(parent);
	}
};

const isFiltered = () => {
	return !_.isEmpty(state.filter);
};

const isMatch = (item) => {
	return !_.isEmpty(_.intersection(item.states, state.filter));
};

const matchesInside = (item) => {
	return _.sumBy(_.filter(item.changeGroups, isMatch), 'count');
};

const currentItems = () => {
	const items = _.map(childrenOf(state.path) || [], (item) => { return { ...item, label: item.name }; });
	if (!isFiltered()) {
		return items;
	}

	return _.filter(_.map(items, (item) => { return { ...item, changesInside: matchesInside(item) }; }), (item) => {
		return isMatch(item) || item.changesInside > 0;
	});
};

const selectsMatches = (item) => {
	return isFiltered() && item.isDir && !isMatch(item);
};

const isOn = (item) => {
	return isFull(item) || (selectsMatches(item) && hasSelectedInside(item.path));
};

const selectMatches = async (item) => {
	const session = state;
	const states = session.filter;
	session.busyPath = item.path;
	render();
	try {
		let offset = 0;
		let hasMore = true;
		while (hasMore && state === session) {
			const response = await appService.browseSnapshotChanges({ snapshot: session.snapshot, path: item.path, states, offset });
			if (response?.status !== 'succeeded') {
				throw new Error(response?.message || 'Could not load the changes.');
			}
			if (state !== session) {
				return;
			}
			for (const match of _.sortBy(response.items, 'path')) {
				await select(match);
			}
			hasMore = response.hasMore;
			offset += CHANGES_PAGE;
		}
	} catch (error) {
		session.error = error.message;
	}
	session.busyPath = null;
};

const turnOn = async (item) => {
	if (selectsMatches(item)) {
		await selectMatches(item);
		return;
	}

	await select(item);
};

const turnOff = (item) => {
	if (isCovered(item.path)) {
		deselect(item);
	}
	if (selectsMatches(item)) {
		state.selected = _.omitBy(state.selected, (value, path) => { return isInside(path, item.path); });
	}
};

const toRow = (item) => {
	const isChecked = isFull(item);
	return { ...item, isChecked, isPartial: (!isChecked && item.isDir && (isCovered(item.path) || hasSelectedInside(item.path))) };
};

const byPath = (item) => {
	return _.toLower(item.path);
};

const toEntries = () => {
	const [folders, files] = _.partition(_.values(state.selected), 'isDir');
	const entries = _.map(folders, (folder) => {
		const excluded = _.filter(_.values(state.excluded), (item) => { return isInside(item.path, folder.path); });
		return { kind: 'folder', path: folder.path, isOpen: state.expanded[folder.path] === true, items: _.sortBy(excluded, [byPath]) };
	});
	_.each(_.groupBy(files, (file) => { return folderOf(file.path); }), (group, path) => {
		if (group.length === 1) {
			entries.push({ kind: 'file', path: group[0].path, size: group[0].size });
			return;
		}

		entries.push({ kind: 'group', path, isOpen: state.expanded[path] === true, size: _.sumBy(group, (file) => { return file.size || 0; }), items: _.sortBy(group, [byPath]) });
	});
	return _.sortBy(entries, [byPath]);
};

const toCrumbs = () => {
	const crumbs = [{ path: ROOT, name: ROOT_NAME, siblings: [] }];
	if (state.path === ROOT) {
		return crumbs;
	}

	const root = _.find(state.listings[ROOT]?.folders, (folder) => { return state.path === folder.path || isInside(state.path, folder.path); });
	if (!root) {
		return crumbs;
	}

	let path = root.path;
	crumbs.push({ path, name: root.name, siblings: state.listings[ROOT].folders });
	_.each(_.compact(state.path.slice(root.path.length).split('/')), (segment) => {
		const siblings = state.listings[path]?.folders || [];
		path = `${path}/${segment}`;
		crumbs.push({ path, name: segment, siblings });
	});
	return crumbs;
};

const render = () => {
	if (!state) {
		return;
	}

	const rows = _.map(currentItems(), toRow);
	const header = {
		isChecked: (!_.isEmpty(rows) && _.every(rows, 'isChecked')),
		isPartial: (!_.every(rows, 'isChecked') && _.some(rows, (row) => { return row.isChecked || row.isPartial; }))
	};
	if (_.isEmpty(state.selected)) {
		state.isCollectionOpen = false;
	}
	morphdom(modal.querySelector('.modal-content'), browserTemplate({ state, rows, header, crumbs: toCrumbs(), entries: toEntries(), listing: state.listings[state.path], canDownload: !getNodeViewBase(), dataPrefix: DATA_PREFIX, prettyBytes }), {
		onBeforeNodeDiscarded: (node) => {
			return !node.classList?.contains('scrollbar');
		}
	});
	_.each(modal.querySelectorAll('input[type="checkbox"]'), (input) => {
		input.indeterminate = (input.dataset.partial === 'true');
	});
	modal.querySelector('.modal-body')?.dispatchEvent(new Event('scroll'));
};

const foldersTo = (path) => {
	if (path === ROOT) {
		return [ROOT];
	}

	const segments = path.split('/');
	return _.concat([ROOT], _.map(_.range(USER_ROOT_DEPTH, segments.length + 1), (depth) => { return _.take(segments, depth).join('/'); }));
};

const reveal = () => {
	if (!state?.focusPath || state.isLoading || !modal.classList.contains('show')) {
		return;
	}

	const input = _.find(modal.querySelectorAll('.browse-check'), (element) => { return element.dataset.path === state.focusPath; });
	state.focusPath = null;
	input?.closest('tr').scrollIntoView({ block: 'center' });
	modal.querySelector('.modal-body')?.dispatchEvent(new Event('scroll'));
};

const load = async () => {
	const session = state;
	const loadId = ++session.loadId;
	session.error = null;
	session.isLoading = true;
	render();
	try {
		for (const folder of foldersTo(session.path)) {
			await fetchListing(session, folder);
		}
	} catch (error) {
		if (session.loadId === loadId) {
			session.error = error.message;
		}
	}
	if (session.loadId !== loadId) {
		return;
	}

	session.isLoading = false;
	if (state === session) {
		render();
	}
};

const navigate = async (path) => {
	state.path = path;
	state.isCollectionOpen = false;
	if (path === ROOT) {
		state.filter = [];
	}
	await load();
};

const filter = (name) => {
	state.filter = (name === '' ? [] : _.xor(state.filter, [name]));
	render();
};

const download = () => {
	if (_.isEmpty(state.selected)) {
		return;
	}

	const form = document.createElement('form');
	form.method = 'post';
	form.action = DOWNLOAD_URL;
	form.hidden = true;
	const input = document.createElement('input');
	input.type = 'hidden';
	input.name = 'selection';
	input.value = JSON.stringify({ snapshot: state.snapshot, items: _.keys(state.selected), excluded: _.keys(state.excluded) });
	form.append(input);
	document.body.append(form);
	form.submit();
	form.remove();
};

const open = async (event) => {
	const button = event.target.closest('.snapshot-browse');
	if (!button) {
		return;
	}

	event.preventDefault();
	bootstrap.Tooltip.getInstance(button)?.hide();
	const session = { snapshot: button.dataset.browseSnapshot, date: button.dataset.browseDate, path: ROOT, focusPath: null, listings: {}, selected: {}, excluded: {}, expanded: {}, filter: [], busyPath: null, loadId: 0, isLoading: false, isCollectionOpen: false, error: null };
	state = session;
	render();
	bootstrap.Modal.getOrCreateInstance(modal).show();
	await navigate(button.dataset.browsePath || ROOT);
	const focus = button.dataset.browseFocus;
	if (state !== session || session.error || !focus) {
		return;
	}

	const item = findItem(focus);
	if (!item) {
		return;
	}

	await select(item);
	if (state !== session) {
		return;
	}

	session.focusPath = focus;
	render();
	reveal();
};

const click = async (event) => {
	if (!state) {
		return;
	}

	const go = event.target.closest('.browse-go');
	if (go) {
		event.preventDefault();
		await navigate(go.dataset.path);
		return;
	}

	const remove = event.target.closest('.browse-remove');
	if (remove) {
		event.preventDefault();
		deselect({ path: remove.dataset.path });
		render();
		return;
	}

	const removeGroup = event.target.closest('.browse-remove-group');
	if (removeGroup) {
		event.preventDefault();
		state.selected = _.omitBy(state.selected, (item, path) => { return !item.isDir && folderOf(path) === removeGroup.dataset.path; });
		render();
		return;
	}

	const include = event.target.closest('.browse-include');
	if (include) {
		event.preventDefault();
		delete state.excluded[include.dataset.path];
		render();
		return;
	}

	const expand = event.target.closest('.browse-expand');
	if (expand) {
		event.preventDefault();
		state.expanded[expand.dataset.path] = !state.expanded[expand.dataset.path];
		render();
		return;
	}

	if (event.target.closest('.browse-filter-clear')) {
		filter('');
		return;
	}

	if (event.target.closest('.browse-download')) {
		download();
		return;
	}

	if (event.target.closest('.browse-restore')) {
		if (!_.isEmpty(state.selected)) {
			module.dispatchEvent(new CustomEvent('snapshot-restore-selection', { detail: { snapshot: state.snapshot, date: state.date, count: _.size(state.selected), items: _.keys(state.selected), excluded: _.keys(state.excluded) } }));
		}
		return;
	}

	if (event.target.closest('.browse-collection')) {
		event.preventDefault();
		state.isCollectionOpen = !state.isCollectionOpen;
		render();
	} else if (event.target.closest('.browse-clear')) {
		state.selected = {};
		state.excluded = {};
		state.expanded = {};
		render();
	}
};

const change = async (event) => {
	if (!state) {
		return;
	}

	if (event.target.classList.contains('browse-filter')) {
		filter(event.target.value);
		return;
	}

	const rows = currentItems();
	if (event.target.classList.contains('browse-check-all')) {
		const isAllOn = _.every(rows, isOn);
		for (const row of rows) {
			if (!state) {
				return;
			}
			if (isAllOn) {
				turnOff(row);
			} else if (!isOn(row)) {
				await turnOn(row);
			}
		}
		render();
		return;
	}

	if (event.target.classList.contains('browse-check')) {
		const row = _.find(rows, { path: event.target.dataset.path });
		if (!row) {
			return;
		}

		if (isOn(row)) {
			turnOff(row);
		} else {
			await turnOn(row);
		}
		render();
	}
};

const close = () => {
	state = null;
};

module.addEventListener('click', open);
modal.addEventListener('click', click);
modal.addEventListener('change', change);
modal.addEventListener('shown.bs.modal', reveal);
modal.addEventListener('hidden.bs.modal', close);
