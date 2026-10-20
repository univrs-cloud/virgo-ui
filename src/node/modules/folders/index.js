import copy from 'copy-to-clipboard';
import page from 'page';
import modulePartial from 'node/modules/folders/partials/index.html';
import folderPartial from 'node/modules/folders/partials/folder.html';
import folderActionsPartial from 'node/modules/folders/partials/folder_actions.html';
import folderDetailsPartial from 'node/modules/folders/partials/folder_details.html';
import * as folderService from 'node/modules/folders/services/folder';
import * as userService from 'node/modules/folders/services/user';
import { filterListByQuery } from 'utils/list_search';
import { getShareAddress } from 'utils/share_address';

const moduleTemplate = _.template(modulePartial);
const folderTemplate = _.template(folderPartial);
const folderActionsTemplate = _.template(folderActionsPartial);
const folderDetailsTemplate = _.template(folderDetailsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#folders');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const listCount = module.querySelector('.list-count');
const table = container.querySelector('.table');
const details = container.querySelector('.details');
let routeFolderName = null;
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'name',
	direction: 'asc'
};
let folders = [];
const folderTabs = {};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const folders = folderService.getFolders();
		const networkInterface = folderService.getDefaultNetworkInterface();
		const jobs = folderService.getJobs();
		render({ folders, networkInterface, jobs });
	}, 300);
};

const order = (event) => {
	if (_.isNull(event.target.closest('.orderable'))) {
		return;
	}
	
	const cell = event.target.closest('.orderable');
	const field = cell.dataset.field;
	tableOrder.field = field;
	
	// Determine direction: if already sorted, toggle; otherwise use default from data attribute
	if (cell.matches('.asc, .desc')) {
		// Already sorted, toggle direction
		tableOrder.direction = (cell.classList.contains('asc') ? 'desc' : 'asc');
	} else {
		// First time sorting this column, use default direction from data attribute (or 'asc' if not specified)
		tableOrder.direction = cell.dataset.defaultOrder || 'asc';
	}
	
	_.each(table.querySelectorAll('thead th'), (cell) => { cell.classList.remove('asc', 'desc'); });
	cell.classList.add(tableOrder.direction);
	const folders = folderService.getFolders();
	const networkInterface = folderService.getDefaultNetworkInterface();
	const jobs = folderService.getJobs();
	render({ folders, networkInterface, jobs });
};

const expand = (event) => {
	if (event.target.closest('a, .dropdown')) {
		return;
	}

	const row = event.target.closest('.item');
	if (_.isNull(row)) {
		return;
	}

	event.preventDefault();
	page(`/folders/${encodeURIComponent(row.dataset.id)}`);
};

const selectTab = (event) => {
	const button = event.target.closest('[data-folder-tab]');
	const name = button?.closest('.item')?.dataset?.id;
	if (!name) {
		return;
	}

	folderTabs[name] = button.dataset.folderTab;
	renderFolderDetails(name);
};

const clearFolderTabs = (name) => {
	_.each(_.keys(folderTabs), (key) => {
		if (_.isUndefined(name) || _.toLower(key) === _.toLower(name)) {
			delete folderTabs[key];
		}
	});
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/folders');
};

const copyToClipboard = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const text = button.nextElementSibling.innerHTML;
	if (copy(text)) {
		const tooltip = bootstrap.Tooltip.getInstance(button);
		const originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const filterJobsByFolder = (jobs, folder) => {
	return _.filter(jobs, (job) => { return job.data?.config?.comment === folder.comment || job.data?.config?.name === folder.name; });
};

const renderFolderDetails = (name) => {
	if (!name) {
		return;
	}

	const folder = _.find(folders, (entry) => { return _.toLower(entry.name) === _.toLower(name); });
	if (!folder) {
		return;
	}

	const jobs = filterJobsByFolder(folderService.getJobs(), folder);
	const users = userService.getUsers();
	const accessOn = getShareAddress(folderService.getSystem());
	const networkMaxBytesPerSec = folderService.getDefaultNetworkInterfaceSpeed();
	morphdom(
		details,
		`<div>${folderDetailsTemplate({ folder, users, jobs, accessOn, networkMaxBytesPerSec, folderTab: folderTabs[name] || 'overview', folderActionsTemplate, prettyBytes })}</div>`,
		{ childrenOnly: true }
	);
};

const hideFolderDetails = () => {
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.folders)) {
		return;
	}

	const accessOn = getShareAddress(folderService.getSystem());
	folders = state.folders;
	folders = filterListByQuery(folders, searchValue, ['name', 'path', 'comment', 'validUsers']);
	const total = _.size(state.folders);
	const noun = (total === 1 ? 'folder' : 'folders');
	listCount.textContent = (_.trim(searchValue) ? `${_.size(folders)} of ${total} ${noun}` : `${total} ${noun}`);
	folders = _.orderBy(folders,
		[
			(folder) => {
				const value = _.get(folder, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	const rows = _.join(_.map(folders, (folder) => {
		const jobs = filterJobsByFolder(state.jobs, folder);
		return folderTemplate({ folder, jobs, accessOn, folderActionsTemplate, prettyBytes });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	if (routeFolderName && !_.some(state.folders, (folder) => { return _.toLower(folder.name) === _.toLower(routeFolderName); })) {
		page('/folders');
	}

	const detailsFolderName = routeFolderName || container.querySelector('.details .item')?.dataset.id;
	if (detailsFolderName) {
		renderFolderDetails(detailsFolderName);
	}

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const handleRoute = (ctx) => {
	const name = ctx?.params?.folderName;
	routeFolderName = (_.isEmpty(name) ? null : name);
	if (_.isEmpty(name)) {
		clearFolderTabs();
		hideFolderDetails();
		return;
	}

	clearFolderTabs(name);
	renderFolderDetails(name);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', selectTab);
searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);
container.addEventListener('click', copyToClipboard);

folderService.subscribe([render]);

import('node/modules/folders/folder_create');
import('node/modules/folders/folder_update');
import('node/modules/folders/folder_delete');
import('node/modules/folders/folder_snapshots');
