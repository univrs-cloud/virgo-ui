import modalPartial from 'node/modules/apps/partials/modals/snapshot_restore.html';
import contentPartial from 'node/modules/apps/partials/modals/snapshot_restore_content.html';
import conflictPartial from 'node/modules/apps/partials/modals/snapshot_restore_conflict.html';
import folderPartial from 'node/modules/apps/partials/modals/snapshot_restore_folder.html';
import * as appService from 'node/modules/apps/services/app';

const SNAPSHOT_PATH_PATTERN = /^.+?\/\.zfs\/snapshot\/[^/]+(\/.+)$/;
const DATA_PREFIX = '/data/';

const contentTemplate = _.template(contentPartial);
const conflictTemplate = _.template(conflictPartial);
const folderTemplate = _.template(folderPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', modalPartial);

const module = document.querySelector('#apps');
const modal = document.querySelector('#snapshot-restore');
const conflictModal = document.querySelector('#snapshot-restore-conflict');
const browserModal = () => { return document.querySelector('#snapshot-browser'); };
let state = null;

const initialState = (file, selection = null) => {
	return { file, selection, isLoading: true, isShown: false, folders: [], selected: null, draft: null, notice: null, error: null, busy: null, inspection: null };
};

const renderContent = (element, html) => {
	morphdom(element.querySelector('.dialog-content'), html, {
		onBeforeNodeDiscarded: (node) => {
			return !node.classList?.contains('scrollbar');
		}
	});
	element.querySelector('.dialog-body')?.dispatchEvent(new Event('scroll'));
};

const render = () => {
	if (!state) {
		return;
	}

	const destination = (state.selected ? state.selected.slice(DATA_PREFIX.length) : '');
	const isCreating = Boolean(findFolder(state.folders, state.selected)?.isVirtual);
	renderContent(modal, contentTemplate({ state, isCreating, folderTemplate }));
	if (state.inspection) {
		renderContent(conflictModal, conflictTemplate({ state, destination, prettyBytes, moment }));
	}
};

const revealSelected = () => {
	const row = modal.querySelector('.tree-selected > .tree-row');
	const body = modal.querySelector('.dialog-body');
	if (!row || !body) {
		return;
	}

	const top = body.getBoundingClientRect().top + (modal.querySelector('.dialog-header')?.offsetHeight || 0);
	const bottom = body.getBoundingClientRect().bottom - (modal.querySelector('.dialog-footer')?.offsetHeight || 0);
	const rect = row.getBoundingClientRect();
	if (rect.top < top || rect.bottom > bottom) {
		row.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}
};

const toVirtualFolder = (parent, name) => {
	return { name, path: `${parent.path}/${name}`, children: [], isOpen: false, isLoading: false, isVirtual: true };
};

const toFolders = (folders) => {
	return _.map(folders, (folder) => { return { ...folder, children: null, isOpen: false, isLoading: false }; });
};

const findFolder = (folders, path) => {
	for (const folder of folders || []) {
		if (folder.path === path) {
			return folder;
		}

		const found = findFolder(folder.children, path);
		if (found) {
			return found;
		}
	}
	return null;
};

const loadFolders = async (path) => {
	const response = await appService.getRestoreFolders(path);
	if (response?.status !== 'succeeded') {
		throw new Error(response?.message || 'Could not load folders.');
	}
	return toFolders(response.folders);
};

const openFolder = async (folder, session) => {
	if (!folder.children) {
		folder.isLoading = true;
		render();
		try {
			const children = await loadFolders(folder.path);
			if (state !== session) {
				return;
			}
			folder.children = children;
		} finally {
			folder.isLoading = false;
		}
	}
	folder.isOpen = true;
};

const revealOriginalFolder = async (session) => {
	const original = session.file.folder;
	const root = _.find(session.folders, (folder) => { return original === folder.path || _.startsWith(original, `${folder.path}/`); });
	if (!root) {
		session.notice = 'The folder this file was in is not available. Choose where to restore the file.';
		return;
	}

	let folder = root;
	const segments = _.compact(original.slice(root.path.length).split('/'));
	for (const segment of segments) {
		await openFolder(folder, session);
		if (state !== session) {
			return;
		}

		let child = _.find(folder.children, { path: `${folder.path}/${segment}` });
		if (!child) {
			child = toVirtualFolder(folder, segment);
			folder.children.unshift(child);
			session.notice = 'The original folder no longer exists. It is created again when you restore.';
		}
		folder = child;
	}
	session.selected = folder.path;
};

const open = async (event) => {
	const link = event.target.closest('.snapshot-restore');
	if (!link) {
		return;
	}

	event.preventDefault();
	bootstrap.Tooltip.getInstance(link)?.hide();
	const relPath = SNAPSHOT_PATH_PATTERN.exec(link.dataset.path)?.[1];
	if (!relPath) {
		return;
	}

	const session = initialState({
		path: link.dataset.path,
		date: link.dataset.date,
		name: relPath.slice(relPath.lastIndexOf('/') + 1),
		folder: relPath.slice(0, relPath.lastIndexOf('/'))
	});
	state = session;
	render();
	bootstrap.Dialog.getOrCreateInstance(modal).show();
	try {
		session.folders = await loadFolders();
		if (state !== session) {
			return;
		}
		await revealOriginalFolder(session);
	} catch (error) {
		session.error = error.message;
	}
	if (state !== session) {
		return;
	}

	session.isLoading = false;
	render();
	if (session.isShown) {
		revealSelected();
	}
};

const openSelection = async (event) => {
	const session = initialState(null, event.detail);
	state = session;
	document.body.append(modal, conflictModal);
	render();
	bootstrap.Dialog.getOrCreateInstance(modal).show();
	try {
		session.folders = await loadFolders();
	} catch (error) {
		session.error = error.message;
	}
	if (state !== session) {
		return;
	}

	session.isLoading = false;
	render();
};

const restoreSelection = async (session) => {
	session.busy = 'restoring';
	session.draft = null;
	session.error = null;
	render();
	let response;
	try {
		response = await appService.restoreSnapshotSelection({ snapshot: session.selection.snapshot, items: session.selection.items, excluded: session.selection.excluded, destination: session.selected });
	} catch (error) {
		response = { status: 'failed', message: error.message };
	}
	if (state !== session) {
		return;
	}

	if (response?.status !== 'succeeded') {
		session.busy = null;
		session.error = response?.message || 'Could not restore the files.';
		render();
		return;
	}

	bootstrap.Dialog.getInstance(modal)?.hide();
	bootstrap.Dialog.getInstance(browserModal())?.hide();
};

const toggleFolder = async (event) => {
	const toggle = event.target.closest('.folder-toggle');
	if (!toggle || !state || state.busy) {
		return;
	}

	event.preventDefault();
	const session = state;
	const folder = findFolder(session.folders, toggle.closest('.restore-folder').dataset.path);
	if (!folder) {
		return;
	}

	if (folder.isOpen) {
		folder.isOpen = false;
		render();
		return;
	}

	session.error = null;
	try {
		await openFolder(folder, session);
	} catch (error) {
		session.error = error.message;
	}
	if (state === session) {
		render();
	}
};

const selectFolder = (event) => {
	const link = event.target.closest('.folder-select');
	if (!link || !state || state.busy) {
		return;
	}

	event.preventDefault();
	state.selected = link.closest('.restore-folder').dataset.path;
	state.error = null;
	render();
};

const addFolder = async (event) => {
	const link = event.target.closest('.folder-add');
	if (!link || !state || state.busy) {
		return;
	}

	event.preventDefault();
	bootstrap.Tooltip.getInstance(link)?.hide();
	const session = state;
	const folder = findFolder(session.folders, link.closest('.restore-folder').dataset.path);
	if (!folder) {
		return;
	}

	session.error = null;
	try {
		await openFolder(folder, session);
	} catch (error) {
		session.error = error.message;
	}
	if (state !== session) {
		return;
	}

	if (!session.error) {
		session.draft = { parent: folder.path, name: '', error: null };
	}
	render();
	modal.querySelector('.folder-name')?.focus();
};

const typeFolderName = (event) => {
	if (!event.target.classList.contains('folder-name') || !state?.draft) {
		return;
	}

	state.draft.name = event.target.value;
};

const commitDraft = () => {
	const parent = findFolder(state.folders, state.draft.parent);
	const name = _.trim(state.draft.name);
	let error = null;
	if (!name) {
		error = `Can't be empty`;
	} else if (_.includes(name, '/') || _.includes(['.', '..'], name) || name.length > 255) {
		error = `Can't be used as a folder name`;
	} else if (_.some(parent.children, (child) => { return _.toLower(child.name) === _.toLower(name); })) {
		error = 'A folder with this name is already there';
	}
	if (error) {
		state.draft.error = error;
		render();
		modal.querySelector('.folder-name')?.focus();
		return;
	}

	const folder = toVirtualFolder(parent, name);
	parent.children.unshift(folder);
	state.selected = folder.path;
	state.draft = null;
	state.error = null;
	render();
};

const cancelDraft = () => {
	state.draft = null;
	render();
};

const clickDraft = (event) => {
	if (!state?.draft || state.busy) {
		return;
	}

	if (event.target.closest('.draft-add')) {
		commitDraft();
	} else if (event.target.closest('.draft-cancel')) {
		cancelDraft();
	}
};

const keyDraft = (event) => {
	if (!event.target.classList?.contains('folder-name') || !state?.draft) {
		return;
	}

	const key = _.toLower(event.key);
	if (key === 'enter') {
		event.preventDefault();
		commitDraft();
	} else if (key === 'escape') {
		event.preventDefault();
		event.stopPropagation();
		cancelDraft();
	}
};

const removeFolder = (event) => {
	const link = event.target.closest('.folder-remove');
	if (!link || !state || state.busy) {
		return;
	}

	event.preventDefault();
	bootstrap.Tooltip.getInstance(link)?.hide();
	const path = link.closest('.restore-folder').dataset.path;
	const parent = findFolder(state.folders, path.slice(0, path.lastIndexOf('/')));
	if (!parent) {
		return;
	}

	parent.children = _.reject(parent.children, { path });
	if (state.selected === path || _.startsWith(state.selected, `${path}/`)) {
		state.selected = parent.path;
	}
	if (state.draft && (state.draft.parent === path || _.startsWith(state.draft.parent, `${path}/`))) {
		state.draft = null;
	}
	render();
};

const restoreFile = async (session, conflict) => {
	session.busy = conflict || 'restoring';
	session.error = null;
	render();
	let response;
	try {
		response = await appService.restoreSnapshotFile({ snapshotPath: session.file.path, destination: session.selected, conflict });
	} catch (error) {
		response = { status: 'failed', message: error.message };
	}
	if (state !== session) {
		return;
	}

	if (response?.status !== 'succeeded') {
		session.busy = null;
		session.error = response?.message || 'Could not restore the file.';
		render();
		return;
	}

	bootstrap.Dialog.getInstance(conflictModal)?.hide();
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const submit = async (event) => {
	if (!event.target.closest('.restore-submit') || !state?.selected || state.busy) {
		return;
	}

	const session = state;
	if (session.selection) {
		await restoreSelection(session);
		return;
	}

	session.busy = 'checking';
	session.draft = null;
	session.error = null;
	render();
	let response;
	try {
		response = await appService.inspectRestore({ snapshotPath: session.file.path, destination: session.selected });
	} catch (error) {
		response = { status: 'failed', message: error.message };
	}
	if (state !== session) {
		return;
	}

	if (response?.status !== 'succeeded') {
		session.busy = null;
		session.error = response?.message || 'Could not check the folder.';
		render();
		return;
	}

	if (response.existing) {
		session.busy = null;
		session.inspection = response;
		render();
		bootstrap.Dialog.getOrCreateInstance(conflictModal).show();
		return;
	}

	await restoreFile(session, null);
};

const confirmConflict = async (event) => {
	const button = event.target.closest('.restore-confirm');
	if (!button || !state || state.busy) {
		return;
	}

	await restoreFile(state, button.dataset.conflict);
};

const closeConflict = () => {
	if (!state) {
		return;
	}

	state.inspection = null;
	state.error = null;
	state.busy = null;
	render();
};

const reveal = () => {
	if (!state) {
		return;
	}

	state.isShown = true;
	if (!state.isLoading) {
		revealSelected();
	}
};

const restore = () => {
	state = null;
	bootstrap.Dialog.getInstance(conflictModal)?.hide();
};

module.addEventListener('click', open);
module.addEventListener('snapshot-restore-selection', openSelection);
modal.addEventListener('click', toggleFolder);
modal.addEventListener('click', selectFolder);
modal.addEventListener('click', addFolder);
modal.addEventListener('click', removeFolder);
modal.addEventListener('click', clickDraft);
modal.addEventListener('input', typeFolderName);
modal.addEventListener('keydown', keyDraft, true);
modal.addEventListener('click', submit);
conflictModal.addEventListener('click', confirmConflict);
conflictModal.addEventListener('hidden.bs.dialog', closeConflict);
modal.addEventListener('shown.bs.dialog', reveal);
modal.addEventListener('hidden.bs.dialog', restore);
