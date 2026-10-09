import page from 'page';
import modulePartial from 'node/modules/apps/partials/index.html';
import appPartial from 'node/modules/apps/partials/app.html';
import appActionsPartial from 'node/modules/apps/partials/app_actions.html';
import appDetailsPartial from 'node/modules/apps/partials/app_details.html';
import appSnapshotsPartial from 'node/modules/apps/partials/app_snapshots.html';
import filtersPartial from 'node/modules/apps/partials/filters.html';
import * as appService from 'node/modules/apps/services/app';
import { getNodeViewBase } from 'node/view';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const appTemplate = _.template(appPartial);
const appActionsTemplate = _.template(appActionsPartial);
const appDetailsTemplate = _.template(appDetailsPartial);
const appSnapshotsTemplate = _.template(appSnapshotsPartial);
const filtersTemplate = _.template(filtersPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#apps');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const details = container.querySelector('.details');
const searchInput = module.querySelector('.search');
const appFilters = module.querySelector('.app-filters');
const table = container.querySelector('.table');
let routeAppName = null;
let searchTimer;
let searchValue = '';
let filterValues = appService.getFilters();
let tableOrder = {
	field: 'title',
	direction: 'asc'
};
let apps = [];
const snapshotSelections = {};
const snapshotFilters = {};
const snapshotSearches = {};
const appTabs = {};
const snapshotResults = {};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const apps = appService.getApps();
		const jobs = appService.getJobs();
		render({ apps, jobs });
	}, 300);
};

const filterApps = (event) => {
	const option = event.target.closest('[data-app-filter]');
	if (!option) {
		return;
	}

	const { appFilter, value } = option.dataset;
	filterValues = (appFilter === 'clear' ? {} : { ...filterValues, [appFilter]: value });
	appService.setFilters(filterValues);
	render({ apps: appService.getApps(), jobs: appService.getJobs() });
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
	const apps = appService.getApps();
	const jobs = appService.getJobs();
	render({ apps, jobs });
};

const expand = (event) => {
	if (event.target.closest('a, .dropdown')) {
		return;
	}

	event.preventDefault();
	const row = event.target.closest('.item');
	const name = row.dataset.name;
	page(`/apps/${encodeURIComponent(name)}`);
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/apps');
};

const update = (event) => {
	if (!_.isNull(event.target.closest('.service'))) {
		return;
	}

	if (event.target.closest('a')?.dataset.action !== 'update') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.item');
	const app = _.find(appService.getApps(), { name: row.dataset.name });
	const data = {
		name: app.name
	};
	appService.update(data);
};

const performAppAction = async (event) => {
	if (!_.isNull(event.target.closest('.service'))) {
		return;
	}

	const button = event.target.closest('a[data-action]');
	if (!button || button.classList.contains('disabled') || button.dataset.action === 'update') {
		return;
	}

	event.preventDefault();
	const row = button.closest('.item');
	const app = _.find(appService.getApps(), { name: row.dataset.name });
	
	const actionMessage = (button.dataset.action === 'uninstall' ? '<br><br>Data will <strong>NOT</strong> be deleted.' : '');
	if (
		button.classList.contains('confirm') &&
		!await confirm(`Are you sure you want to ${button.dataset.action} the ${(app.isUnmanaged && !app.isStack ? 'container' : 'app')} ${app.title}?${actionMessage}`, { buttons: [{ text: _.upperFirst(button.dataset.action), class: (button.classList.contains('confirm') ? 'btn-solid theme-danger' : 'btn-solid theme-primary') }] })
	) {
		return;
	}

	if (app.isUnmanaged && !app.isStack) {
		appService.performServiceAction({ id: app.projectContainers[0].id, action: button.dataset.action });
		return;
	}

	const data = {
		name: app.name,
		action: button.dataset.action
	};
	appService.performAppAction(data);
};

const performServiceAction = async (event) => {
	if (_.isNull(event.target.closest('.service'))) {
		return;
	}

	const button = event.target.closest('a[data-action]');
	if (!button || button.classList.contains('disabled')) {
		return;
	}

	event.preventDefault();
	const row = button.closest('.service');
	const service = _.find(_.flatMap(appService.getApps(), 'projectContainers'), { id: row.dataset.id });

	if (
		button.classList.contains('confirm') &&
		!await confirm(`Are you sure you want to ${button.dataset.action} the service ${service.labels?.comDockerComposeService || _.trimStart(_.first(service.names), '/')}?`, { buttons: [{ text: _.upperFirst(button.dataset.action), class: (button.classList.contains('confirm') ? 'btn-solid theme-danger' : 'btn-solid theme-primary') }] })
	) {
		return;
	}

	const data = {
		id: service.id,
		action: button.dataset.action
	};
	appService.performServiceAction(data);
};

const toggleStateTooltip = (event) => {
	if (!event.target.classList?.contains('state-icon')) {
		return;
	}

	const dot = event.target.querySelector('.state-dot');
	const tooltip = bootstrap.Tooltip.getOrCreateInstance(dot, { selector: false, trigger: 'manual' });
	if (event.type === 'mouseenter') {
		tooltip.show();
	} else {
		tooltip.hide();
	}
};

const selectTab = (event) => {
	const button = event.target.closest('[data-app-tab]');
	const name = button?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	appTabs[name] = button.dataset.appTab;
	renderAppDetails(name);
};

const selectSnapshot = (event) => {
	const target = event.target.closest('[data-snapshot]');
	const name = target?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	snapshotSelections[name] = target.dataset.snapshot;
	renderAppDetails(name);
};

const scrubSnapshot = (event) => {
	if (!event.target.classList.contains('snapshot-scrubber')) {
		return;
	}

	const name = event.target.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	const keys = event.target.dataset.keys.split(',');
	const positions = _.map(event.target.dataset.positions.split(','), Number);
	const value = event.target.value / 1000;
	const index = _.minBy(_.range(keys.length), (i) => { return Math.abs(positions[i] - value); });
	snapshotSelections[name] = keys[index];
	renderAppDetails(name);
};

const stepSnapshot = (event) => {
	if (!event.target.classList.contains('snapshot-scrubber')) {
		return;
	}

	const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1, Home: -Infinity, End: Infinity }[event.key];
	const name = event.target.closest('.item')?.dataset?.name;
	if (!step || !name) {
		return;
	}

	event.preventDefault();
	const keys = event.target.dataset.keys.split(',');
	const index = _.clamp(_.indexOf(keys, event.target.dataset.selected) + step, 0, keys.length - 1);
	snapshotSelections[name] = keys[index];
	renderAppDetails(name);
};

const filterSnapshots = async (event) => {
	const option = event.target.closest('[data-snapshot-filter]');
	const name = option?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	const { snapshotFilter, value } = option.dataset;
	const term = option.closest('.item').querySelector('.snapshot-search')?.value;
	snapshotFilters[name] = (snapshotFilter === 'clear' ? {} : { ...snapshotFilters[name], [snapshotFilter]: value });
	if (!await submitSnapshotSearch(name, term)) {
		renderAppDetails(name);
	}
};

const searchSnapshots = async (event) => {
	if (!event.target.classList?.contains('snapshot-search') || _.toLower(event.key) !== 'enter') {
		return;
	}

	await submitSnapshotSearch(event.target.closest('.item')?.dataset?.name, event.target.value);
};

const submitSnapshotSearch = async (name, value) => {
	const term = _.trim(value);
	if (!term || snapshotSearches[name]) {
		return false;
	}

	const filter = snapshotFilters[name] || {};
	const sizes = {
		small: { maxSize: 1048575 },
		medium: { minSize: 1048576, maxSize: 104857599 },
		large: { minSize: 104857600, maxSize: 1073741823 },
		huge: { minSize: 1073741824 }
	};
	const days = { '1d': 1, '7d': 7, '30d': 30, '365d': 365 };
	const query = { term, ...sizes[filter.size] };
	if (filter.type) {
		query.type = filter.type;
	}
	if (filter.state) {
		query.state = filter.state;
	}
	if (days[filter.modified]) {
		query.since = moment().subtract(days[filter.modified], 'days').toISOString();
	}

	await runSnapshotSearch(name, query, false);
	return true;
};

const loadMoreSnapshots = async (event) => {
	const button = event.target.closest('.snapshot-search-more');
	const name = button?.closest('.item')?.dataset?.name;
	const current = snapshotResults[name];
	if (!current || snapshotSearches[name]) {
		return;
	}

	await runSnapshotSearch(name, { ...current.query, offset: _.size(current.results) }, true);
};

const clearSnapshotSearch = (event) => {
	const button = event.target.closest('.snapshot-search-clear');
	const name = button?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	delete snapshotResults[name];
	delete snapshotFilters[name];
	button.closest('.item').querySelector('.snapshot-search').value = '';
	renderAppDetails(name);
};

const runSnapshotSearch = async (name, query, append) => {
	const previous = (append ? snapshotResults[name] : null);
	snapshotSearches[name] = true;
	renderAppDetails(name);
	let result;
	try {
		const response = await appService.searchSnapshots(query);
		if (response?.status === 'succeeded') {
			result = { query, results: [...(previous?.results || []), ...response.results], hasMore: response.hasMore };
		} else {
			result = { query, results: previous?.results || [], hasMore: previous?.hasMore || false, message: response?.message || 'Search failed.' };
		}
	} catch (error) {
		result = { query, results: previous?.results || [], hasMore: previous?.hasMore || false, message: error.message };
	}

	if (_.toLower(routeAppName) !== _.toLower(name)) {
		return;
	}

	snapshotResults[name] = result;
	delete snapshotSearches[name];
	renderAppDetails(name);
	if (!append) {
		const input = details.querySelector(`.item[data-name="${name}"] .snapshot-search`);
		await input?.updateComplete;
		input?.focus();
	}
};

const filterJobsByApp = (jobs, app) => {
	const containerIds = _.map(app.projectContainers, 'id');
	const appJobs = _.filter(jobs, (job) => { return job.data?.config?.name === app.name; });
	const serviceJobs = _.filter(jobs, (job) => { return _.includes(containerIds, job.data?.config?.id); });
	return { jobs: _.concat(appJobs, serviceJobs), appJobs, serviceJobs };
};

const renderAppDetails = (name) => {
	if (!name) {
		return;
	}

	const app = _.find(apps, { name });
	if (!app) {
		return;
	}

	const { jobs, appJobs, serviceJobs } = filterJobsByApp(appService.getJobs(), app);
	const networkMaxBytesPerSec = appService.getDefaultNetworkInterfaceSpeed();
	morphdom(
		details,
		`<div>${appDetailsTemplate({ app, jobs, appJobs, serviceJobs, appActionsTemplate, appSnapshotsTemplate, networkMaxBytesPerSec, selectedSnapshot: snapshotSelections[name], snapshotFilter: snapshotFilters[name] || {}, snapshotSearching: Boolean(snapshotSearches[name]), appTab: appTabs[name] || 'services', snapshotResults: snapshotResults[name] || null, canDownloadSnapshotFiles: !getNodeViewBase(), prettyBytes, moment })}</div>`,
		{
			childrenOnly: true,
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('logs-container') || fromEl.classList.contains('terminal-container')) {
					return false;
				}
			}
		}
	);
};

const clearAppState = (name) => {
	_.each([snapshotSelections, snapshotFilters, snapshotSearches, appTabs, snapshotResults], (state) => {
		_.each(_.keys(state), (key) => {
			if (_.isUndefined(name) || _.toLower(key) === _.toLower(name)) {
				delete state[key];
			}
		});
	});
};

const hideAppDetails = () => {
	module.dispatchEvent(new CustomEvent('details:hide'));
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.apps)) {
		return;
	}
	
	const categories = _.sortBy(_.uniqBy(_.compact(_.map(state.apps, 'category')), _.toLower), _.toLower);
	morphdom(
		appFilters,
		`<div>${filtersTemplate({ categories, filters: filterValues })}</div>`,
		{ childrenOnly: true }
	);

	apps = state.apps;
	apps = filterListByQuery(apps, searchValue, ['title', 'name', 'icon', 'urls']);
	const statusStates = { running: 'success', partial: 'warning', stopped: 'danger' };
	apps = _.filter(apps, (app) => {
		if (filterValues.category && _.toLower(app.category) !== _.toLower(filterValues.category)) {
			return false;
		}
		if (filterValues.status && app.state !== statusStates[filterValues.status]) {
			return false;
		}
		if (filterValues.updates && app.hasUpdates !== (filterValues.updates === 'available')) {
			return false;
		}
		return true;
	});
	apps = _.orderBy(apps,
		[
			(app) => {
				const value = _.get(app, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	const rows = _.join(_.map(apps, (app) => {
		const { jobs } = filterJobsByApp(state.jobs, app);
		return appTemplate({ app, jobs, appActionsTemplate, prettyBytes });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	if (routeAppName && !_.some(state.apps, (app) => { return _.toLower(app.name) === _.toLower(routeAppName); })) {
		page('/apps');
	}

	const detailsAppName = routeAppName || container.querySelector('.details .item')?.dataset.name;
	if (detailsAppName) {
		renderAppDetails(detailsAppName);
	}
	
	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const handleRoute = (ctx) => {
	const name = ctx?.params?.appName;
	routeAppName = (_.isEmpty(name) ? null : name);
	if (_.isEmpty(name)) {
		clearAppState();
		hideAppDetails();
		return;
	}

	clearAppState(name);
	renderAppDetails(name);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', update);
module.addEventListener('click', performAppAction);
module.addEventListener('click', performServiceAction);
module.addEventListener('click', selectTab);
module.addEventListener('click', loadMoreSnapshots);
module.addEventListener('click', clearSnapshotSearch);
module.addEventListener('click', selectSnapshot);
module.addEventListener('click', filterSnapshots);
module.addEventListener('input', scrubSnapshot);
module.addEventListener('keydown', stepSnapshot);
module.addEventListener('keydown', searchSnapshots);
module.addEventListener('mouseenter', toggleStateTooltip, true);
module.addEventListener('mouseleave', toggleStateTooltip, true);
searchInput.addEventListener('input', search);
appFilters.addEventListener('click', filterApps);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);

appService.subscribe([render]);

import('node/modules/apps/logs');
import('node/modules/apps/terminal');
import('node/modules/apps/app_center');
import('node/modules/apps/app_install');
import('node/modules/apps/snapshot_restore');
import('node/modules/apps/snapshot_browse');
