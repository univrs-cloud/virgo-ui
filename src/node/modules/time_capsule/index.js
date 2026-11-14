import copy from 'copy-to-clipboard';
import page from 'page';
import modulePartial from 'node/modules/time_capsule/partials/index.html';
import backupDiskPartial from 'node/modules/time_capsule/partials/backup_disk.html';
import backupDiskActionsPartial from 'node/modules/time_capsule/partials/backup_disk_actions.html';
import backupDiskDetailsPartial from 'node/modules/time_capsule/partials/backup_disk_details.html';
import backupDisksImage from 'assets/img/illustrations/backup-disks.svg';
import noResultsImage from 'assets/img/illustrations/no-results.svg';
import * as backupDiskService from 'node/modules/time_capsule/services/backup_disk';
import * as userService from 'node/modules/time_capsule/services/user';
import { filterListByQuery } from 'utils/list_search';
import { getShareAddress } from 'utils/share_address';

const moduleTemplate = _.template(modulePartial);
const backupDiskTemplate = _.template(backupDiskPartial);
const backupDiskActionsTemplate = _.template(backupDiskActionsPartial);
const backupDiskDetailsTemplate = _.template(backupDiskDetailsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ backupDisksImage, noResultsImage }));
const module = document.querySelector('#time-capsule');
const loading = module.querySelector('.loading');
const emptyList = module.querySelector('.empty-list');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const listCount = module.querySelector('.list-count');
const table = container.querySelector('.table');
const tableScroll = container.querySelector('.table-scroll');
const noResults = container.querySelector('.no-results');
const details = container.querySelector('.details');
let routeBackupDiskName = null;
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'name',
	direction: 'asc'
};
let backupDisks = [];
const backupDiskTabs = {};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const backupDisks = backupDiskService.getBackupDisks();
		const networkInterface = backupDiskService.getDefaultNetworkInterface();
		const jobs = backupDiskService.getJobs();
		render({ backupDisks, networkInterface, jobs });
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
	const backupDisks = backupDiskService.getBackupDisks();
	const networkInterface = backupDiskService.getDefaultNetworkInterface();
	const jobs = backupDiskService.getJobs();
	render({ backupDisks, networkInterface, jobs });
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
	page(`/time-capsule/${encodeURIComponent(row.dataset.id)}`);
};

const selectTab = (event) => {
	const button = event.target.closest('[data-backup-disk-tab]');
	const name = button?.closest('.item')?.dataset?.id;
	if (!name) {
		return;
	}

	backupDiskTabs[name] = button.dataset.backupDiskTab;
	renderBackupDiskDetails(name);
};

const clearBackupDiskTabs = (name) => {
	_.each(_.keys(backupDiskTabs), (key) => {
		if (_.isUndefined(name) || _.toLower(key) === _.toLower(name)) {
			delete backupDiskTabs[key];
		}
	});
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/time-capsule');
};

const copyToClipboard = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const text = button.nextElementSibling.textContent;
	if (await copy(text)) {
		const tooltip = bootstrap.Tooltip.getInstance(button);
		const originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const filterJobsByBackupDisk = (jobs, backupDisk) => {
	return _.filter(jobs, (job) => { return job.data?.config?.comment === backupDisk.comment; });
};

const renderBackupDiskDetails = (name) => {
	if (!name) {
		return;
	}

	const backupDisk = _.find(backupDisks, (entry) => { return _.toLower(entry.name) === _.toLower(name); });
	if (!backupDisk) {
		return;
	}

	const jobs = filterJobsByBackupDisk(backupDiskService.getJobs(), backupDisk);
	const users = userService.getUsers();
	const accessOn = getShareAddress(backupDiskService.getSystem());
	const networkMaxBytesPerSec = backupDiskService.getDefaultNetworkInterfaceSpeed();
	morphdom(
		details,
		`<div>${backupDiskDetailsTemplate({ backupDisk, users, jobs, accessOn, networkMaxBytesPerSec, backupDiskTab: backupDiskTabs[name] || 'overview', backupDiskActionsTemplate, prettyBytes, moment })}</div>`,
		{ childrenOnly: true }
	);
};

const hideBackupDiskDetails = () => {
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.backupDisks)) {
		return;
	}

	backupDisks = state.backupDisks;
	backupDisks = filterListByQuery(backupDisks, searchValue, ['name', 'path', 'comment', 'validUsers']);
	const total = _.size(state.backupDisks);
	const noun = (total === 1 ? 'backup disk' : 'backup disks');
	listCount.textContent = (_.trim(searchValue) ? `${_.size(backupDisks)} of ${total} ${noun}` : `${total} ${noun}`);
	backupDisks = _.orderBy(backupDisks,
		[
			(backupDisk) => {
				const value = (tableOrder.field === 'backups' ? _.sumBy(backupDisk.backups, (machine) => { return _.size(machine.snapshots || []); }) : _.get(backupDisk, tableOrder.field));
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	const rows = _.join(_.map(backupDisks, (backupDisk) => {
		const jobs = filterJobsByBackupDisk(state.jobs, backupDisk);
		return backupDiskTemplate({ backupDisk, jobs, backupDiskActionsTemplate, prettyBytes, moment });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	if (routeBackupDiskName && !_.some(state.backupDisks, (backupDisk) => { return _.toLower(backupDisk.name) === _.toLower(routeBackupDiskName); })) {
		page('/time-capsule');
	}

	const detailsBackupDiskName = routeBackupDiskName || container.querySelector('.details .item')?.dataset.id;
	if (detailsBackupDiskName) {
		renderBackupDiskDetails(detailsBackupDiskName);
	}

	const isEmpty = _.isEmpty(state.backupDisks);
	const hasNoMatch = (!isEmpty && _.isEmpty(backupDisks));
	tableScroll.classList.toggle('d-none', hasNoMatch);
	noResults.classList.toggle('d-none', !hasNoMatch);
	loading.classList.add('d-none');
	emptyList.classList.toggle('d-none', !isEmpty);
	container.classList.toggle('d-none', isEmpty);
};

const handleRoute = (ctx) => {
	const name = ctx?.params?.backupDiskName;
	routeBackupDiskName = (_.isEmpty(name) ? null : name);
	if (_.isEmpty(name)) {
		clearBackupDiskTabs();
		hideBackupDiskDetails();
		return;
	}

	clearBackupDiskTabs(name);
	renderBackupDiskDetails(name);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', selectTab);
searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);
container.addEventListener('click', copyToClipboard);

backupDiskService.subscribe([render]);

import('node/modules/time_capsule/backup_disk_create');
import('node/modules/time_capsule/backup_disk_update');
import('node/modules/time_capsule/backup_disk_delete');
