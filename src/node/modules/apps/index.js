import page from 'page';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import modulePartial from 'node/modules/apps/partials/index.html';
import appPartial from 'node/modules/apps/partials/app.html';
import appActionsPartial from 'node/modules/apps/partials/app_actions.html';
import appDetailsPartial from 'node/modules/apps/partials/app_details.html';
import appProtectionPartial from 'node/modules/apps/partials/app_protection.html';
import appRecoveryPartial from 'node/modules/apps/partials/app_recovery.html';
import appSnapshotActionsPartial from 'node/modules/apps/partials/app_snapshot_actions.html';
import appNextcloudAppsPartial from 'node/modules/apps/partials/app_nextcloud_apps.html';
import appMailserverPartial from 'node/modules/apps/partials/app_mailserver.html';
import appNextcloudAccountsPartial from 'node/modules/apps/partials/app_nextcloud_accounts.html';
import appMailDnsRecordsPartial from 'node/modules/apps/partials/app_mail_dns_records.html';
import filtersPartial from 'node/modules/apps/partials/filters.html';
import appsImage from 'assets/img/illustrations/apps.svg';
import noResultsImage from 'assets/img/illustrations/no-results.svg';
import * as appService from 'node/modules/apps/services/app';
import { renderSnapshots, clearSnapshots } from 'node/snapshots';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const appTemplate = _.template(appPartial);
const appActionsTemplate = _.template(appActionsPartial);
const appDetailsTemplate = _.template(appDetailsPartial);
const appProtectionTemplate = _.template(appProtectionPartial);
const appRecoveryTemplate = _.template(appRecoveryPartial);
const appSnapshotActionsTemplate = _.template(appSnapshotActionsPartial);
const appNextcloudAppsTemplate = _.template(appNextcloudAppsPartial);
const appMailserverTemplate = _.template(appMailserverPartial);
const appNextcloudAccountsTemplate = _.template(appNextcloudAccountsPartial);
const mailDnsRecordsTemplate = _.template(appMailDnsRecordsPartial);
const filtersTemplate = _.template(filtersPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ appsImage, noResultsImage }));
const module = document.querySelector('#apps');
const loading = module.querySelector('.loading');
const emptyList = module.querySelector('.empty-list');
const container = module.querySelector('.container-fluid');
const details = container.querySelector('.details');
const searchInput = module.querySelector('.search');
const listCount = module.querySelector('.list-count');
const filterMenu = module.querySelector('.filter-menu');
const filterCount = module.querySelector('.filter-count');
const table = container.querySelector('.table');
const tableScroll = container.querySelector('.table-scroll');
const noResults = container.querySelector('.no-results');
let routeAppName = null;
let isWatchingResourceMetrics = false;
let searchTimer;
let searchValue = '';
let filterValues = appService.getFilters();
let tableOrder = {
	field: 'title',
	direction: 'asc'
};
let apps = [];
const appTabs = {};
const expandedChangelogs = new Set();
const expandedDns = new Set();

const renderChangelog = (changelog) => {
	const template = document.createElement('template');
	template.innerHTML = DOMPurify.sanitize(marked.parse(String(changelog ?? '')));
	_.each(template.content.querySelectorAll('h1, h2, h3, h4, h5, h6'), (heading) => {
		const title = document.createElement('div');
		title.className = (heading === template.content.firstElementChild ? 'fw-semibold mb-1' : 'fw-semibold mt-3 mb-1');
		title.innerHTML = heading.innerHTML;
		heading.replaceWith(title);
	});
	_.each(template.content.querySelectorAll('a'), (link) => {
		link.setAttribute('target', '_blank');
		link.setAttribute('rel', 'noopener noreferrer');
	});
	return template.innerHTML;
};

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
	const option = event.target.closest('button[data-filter-key], button[data-action="reset-filters"]');
	if (!option) {
		return;
	}

	const { filterKey, value } = option.dataset;
	if (option.dataset.action === 'reset-filters') {
		filterValues = { category: [], status: '', updates: '', snapshots: '' };
	} else if (filterKey === 'category') {
		const others = _.reject(filterValues.category, (category) => { return _.toLower(category) === _.toLower(value); });
		filterValues = { ...filterValues, category: (others.length === filterValues.category.length ? [...others, value] : others) };
	} else {
		filterValues = { ...filterValues, [filterKey]: value };
	}
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
	if (_.toLower(app.name) === 'nextcloud') {
		data.containers = true;
		appService.updateNextcloudApps(data);
		return;
	}

	appService.update(data);
};

const toggleChangelog = (event) => {
	const toggle = event.target.closest('[data-nextcloud-changelog]');
	const name = toggle?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	event.preventDefault();
	const id = toggle.dataset.nextcloudChangelog;
	if (expandedChangelogs.has(id)) {
		expandedChangelogs.delete(id);
	} else {
		expandedChangelogs.add(id);
	}
	renderAppDetails(name);
};

const toggleDns = (event) => {
	const toggle = event.target.closest('[data-mail-dns]');
	const name = toggle?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	event.preventDefault();
	const domain = toggle.dataset.mailDns;
	if (expandedDns.has(domain)) {
		expandedDns.delete(domain);
	} else {
		expandedDns.add(domain);
	}
	renderAppDetails(name);
};

const performMailAction = async (event) => {
	const button = event.target.closest('[data-mail-action]');
	const name = button?.closest('.item')?.dataset?.name;
	if (!name || button.hasAttribute('disabled')) {
		return;
	}

	event.preventDefault();
	const { mailAction: action, domain, email, address, recipient, ip } = button.dataset;
	const confirmations = {
		'domain:delete': [`Are you sure you want to delete the domain ${domain}?<br><br>Its DKIM key is <strong>permanently deleted</strong> and can only be recovered from a snapshot of MailServer. If you add ${domain} again, it gets a new key and its DKIM record has to be replaced in its DNS. Remove the domain's DNS records at your DNS provider too.`, 'Delete', 'I understand the DKIM key of this domain will be permanently deleted'],
		'dkim:regenerate': [`Are you sure you want to create a new DKIM key for ${domain}?<br><br>The current key is replaced right away. Mail sent from ${domain} is signed with the new key from then on, and receiving servers can only check it once the new record is in the DNS of ${domain}. Until then, that mail can be <strong>marked as spam or rejected</strong>.<br><br>Right after creating it, open <strong>DNS records</strong> under ${domain}, copy the new value of the TXT record <strong>${_.find(appService.getMailserver()?.domains, { name: domain })?.dkim?.selector ?? 'dms'}._domainkey.${domain}</strong>, and replace the old value at your DNS provider. The change can take a few hours to reach every server.`, 'Create new key'],
		'account:delete': [`Are you sure you want to delete the account ${email}?<br><br>All of its mail, its aliases and its storage limit are <strong>permanently deleted</strong>. The mail can only be recovered from a snapshot of MailServer.`, 'Delete', 'I understand all mail in this account will be permanently deleted'],
		'alias:remove': [`Are you sure you want ${address} to stop forwarding to ${recipient}?`, 'Remove']
	};
	if (confirmations[action] && !await confirm(confirmations[action][0], { buttons: [{ text: confirmations[action][1], class: 'btn-solid theme-danger' }], acknowledge: confirmations[action][2] })) {
		return;
	}

	appService.manageMailserver(action, _.omitBy({ name, domain, email, address, recipient, ip }, _.isUndefined));
};

const changeNextcloudGroup = (event) => {
	const trigger = event.target.closest('[data-nextcloud-group-action]');
	const name = trigger?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	event.preventDefault();
	appService.manageNextcloudAccounts(`group:${trigger.dataset.nextcloudGroupAction}`, { name, user: trigger.dataset.user, group: trigger.dataset.group });
};

const performNextcloudAction = (event) => {
	const button = event.target.closest('[data-nextcloud-action]');
	if (!button || button.hasAttribute('disabled')) {
		return;
	}

	event.preventDefault();
	if (button.dataset.nextcloudAction === 'check') {
		appService.checkNextcloudAppUpdates();
		return;
	}

	const data = {
		name: button.closest('.item').dataset.name
	};
	if (button.dataset.nextcloudApp) {
		data.app = button.dataset.nextcloudApp;
	}
	appService.updateNextcloudApps(data);
};

const performAppAction = async (event) => {
	if (!_.isNull(event.target.closest('.service'))) {
		return;
	}

	const button = event.target.closest('[data-action]:not([data-action="reset-filters"])');
	if (!button || button.dataset.action === 'update') {
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

	const button = event.target.closest('[data-action]:not([data-action="reset-filters"])');
	if (!button) {
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
	if (_.startsWith(button.dataset.appTab, 'mail-')) {
		appService.fetchMailserver();
	}
	if (button.dataset.appTab === 'nextcloud-accounts') {
		appService.fetchNextcloudAccounts();
	}
	renderAppDetails(name);
};

const updateSnapshots = async (event) => {
	const button = event.target.closest('[data-snapshot-mode]');
	const name = button?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	event.preventDefault();
	const app = _.find(appService.getApps(), { name });
	const mode = button.dataset.snapshotMode;
	if (!app || _.toLower(app.snapshotPolicy?.mode) === _.toLower(mode)) {
		return;
	}

	if (
		mode === 'disabled' &&
		!await confirm(`Are you sure you want to disable snapshots for the app ${app.title}?<br><br>All existing snapshots of this app will be <strong>permanently deleted</strong> and no new ones will be taken. Without snapshots, its data can no longer be recovered after an accidental deletion, a corruption or a failed update.<br><br>To stop taking new snapshots while keeping the existing ones, pause them instead.`, { buttons: [{ text: 'Disable', class: 'btn-solid theme-danger' }] })
	) {
		return;
	}

	const rule = button.dataset.snapshotEnableRule;
	const data = {
		name: app.name,
		mode,
		...(rule && { rule })
	};
	appService.updateSnapshots(data);
};

const updateSnapshotRule = (event) => {
	const button = event.target.closest('[data-snapshot-rule]');
	const name = button?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	event.preventDefault();
	const app = _.find(appService.getApps(), { name });
	const rule = button.dataset.snapshotRule;
	if (!app || _.toLower(app.snapshotPolicy?.rule) === _.toLower(rule)) {
		return;
	}

	const data = {
		name: app.name,
		rule
	};
	appService.updateSnapshots(data);
};

const rollback = async (event) => {
	const button = event.target.closest('[data-rollback-snapshot]');
	const name = button?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	const app = _.find(appService.getApps(), { name });
	if (!app) {
		return;
	}

	const date = button.dataset.rollbackDate;
	if (!await confirm(`Are you sure you want to roll back ${app.title} to ${date}?<br><br>${app.title} will be stopped, its data and settings will be put back as they were on ${date}, and it will be started again with the versions it ran then.<br><br>Everything ${app.title} saved after ${date} will be <strong>permanently lost</strong>, together with the snapshots taken since then.`, { buttons: [{ text: 'Roll back', class: 'btn-solid theme-danger' }], acknowledge: 'I understand this permanently erases data and this cannot be undone' })) {
		return;
	}

	const data = {
		name: app.name,
		snapshot: button.dataset.rollbackSnapshot
	};
	appService.rollback(data);
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
	const nextcloudJobs = _.filter(appService.getJobs(), (job) => { return _.startsWith(job.name, 'app:nextcloud:'); });
	const nextcloudAppUpdates = appService.getNextcloudAppUpdates();
	const mailserver = appService.getMailserver();
	const nextcloudAccounts = appService.getNextcloudAccounts();
	const networkMaxBytesPerSec = appService.getDefaultNetworkInterfaceSpeed();
	const snapshotRules = appService.getSnapshotRules();
	const isIntegrationRunning = _.some(app.projectContainers, (container) => { return _.toLower(container.labels?.comDockerComposeService) === _.toLower(app.name) && container.state === 'running'; });
	const requestedTab = (appTabs[name] || 'services');
	const appTab = (!isIntegrationRunning && (_.startsWith(requestedTab, 'mail-') || _.startsWith(requestedTab, 'nextcloud-')) ? 'services' : requestedTab);
	morphdom(
		details,
		`<div>${appDetailsTemplate({ app, jobs, appJobs, serviceJobs, nextcloudJobs, nextcloudAppUpdates, nextcloudAccounts, mailserver, snapshotRules, appActionsTemplate, appProtectionTemplate, appRecoveryTemplate, appSnapshotActionsTemplate, appNextcloudAppsTemplate, appNextcloudAccountsTemplate, appMailserverTemplate, mailDnsRecordsTemplate, expandedChangelogs: [...expandedChangelogs], expandedDns: [...expandedDns], renderChangelog, renderSnapshots, networkMaxBytesPerSec, isIntegrationRunning, appTab, prettyBytes, prettyMilliseconds, moment })}</div>`,
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
	_.each(_.keys(appTabs), (key) => {
		if (_.isUndefined(name) || _.toLower(key) === _.toLower(name)) {
			delete appTabs[key];
		}
	});
	if (_.isUndefined(name) || _.toLower(name) === 'nextcloud') {
		expandedChangelogs.clear();
	}
	if (_.isUndefined(name) || _.toLower(name) === 'mailserver') {
		expandedDns.clear();
	}
	clearSnapshots((key) => { return (_.isUndefined(name) ? _.startsWith(key, 'app:') : _.toLower(key) === _.toLower(`app:${name}`)); });
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
	
	const statusStates = { running: 'success', partial: 'warning', stopped: 'danger' };
	const categories = _.sortBy(_.uniqBy([..._.compact(_.map(state.apps, 'category')), ...filterValues.category], _.toLower), _.toLower);
	const present = {
		status: _.uniq(_.map(state.apps, (app) => { return _.invert(statusStates)[app.state]; })),
		updates: _.uniq(_.map(state.apps, (app) => { return (app.hasUpdates || app.hasNextcloudAppUpdates ? 'available' : 'current'); })),
		snapshots: _.uniq(_.map(state.apps, (app) => { return _.toLower(app.snapshotPolicy?.mode); }))
	};
	morphdom(
		filterMenu,
		`<div>${filtersTemplate({ categories, present, filters: filterValues })}</div>`,
		{ childrenOnly: true }
	);
	const activeFilters = filterValues.category.length + _.size(_.compact([filterValues.status, filterValues.updates, filterValues.snapshots]));
	filterCount.textContent = activeFilters || '';

	apps = state.apps;
	apps = filterListByQuery(apps, searchValue, ['title', 'name', 'icon', 'urls']);
	apps = _.filter(apps, (app) => {
		if (!_.isEmpty(filterValues.category) && !_.includes(_.map(filterValues.category, _.toLower), _.toLower(app.category))) {
			return false;
		}
		if (filterValues.status && app.state !== statusStates[filterValues.status]) {
			return false;
		}
		if (filterValues.updates && (app.hasUpdates || app.hasNextcloudAppUpdates) !== (filterValues.updates === 'available')) {
			return false;
		}
		if (filterValues.snapshots && _.toLower(app.snapshotPolicy?.mode) !== _.toLower(filterValues.snapshots)) {
			return false;
		}
		return true;
	});
	const total = _.size(state.apps);
	const noun = (total === 1 ? 'app' : 'apps');
	listCount.textContent = (_.trim(searchValue) || activeFilters ? `${_.size(apps)} of ${total} ${noun}` : `${total} ${noun}`);
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
	
	const isEmpty = _.isEmpty(state.apps);
	const hasNoMatch = (!isEmpty && _.isEmpty(apps));
	tableScroll.classList.toggle('d-none', hasNoMatch);
	noResults.classList.toggle('d-none', !hasNoMatch);
	loading.classList.add('d-none');
	emptyList.classList.toggle('d-none', !isEmpty);
	container.classList.toggle('d-none', isEmpty);
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

const syncResourceMetrics = () => {
	const shouldWatch = (!module.classList.contains('d-none') && document.visibilityState === 'visible');
	if (shouldWatch === isWatchingResourceMetrics) {
		return;
	}

	isWatchingResourceMetrics = shouldWatch;
	appService.watchResourceMetrics(shouldWatch);
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', update);
module.addEventListener('click', performAppAction);
module.addEventListener('click', performNextcloudAction);
module.addEventListener('click', changeNextcloudGroup);
module.addEventListener('click', toggleChangelog);
module.addEventListener('click', toggleDns);
module.addEventListener('click', performMailAction);
module.addEventListener('click', performServiceAction);
module.addEventListener('click', selectTab);
module.addEventListener('click', updateSnapshots);
module.addEventListener('click', updateSnapshotRule);
module.addEventListener('click', rollback);
module.addEventListener('mouseenter', toggleStateTooltip, true);
module.addEventListener('mouseleave', toggleStateTooltip, true);
searchInput.addEventListener('input', search);
filterMenu.addEventListener('click', filterApps);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);

appService.subscribe([render]);
new MutationObserver(syncResourceMetrics).observe(module, { attributes: true, attributeFilter: ['class'] });
document.addEventListener('visibilitychange', syncResourceMetrics);
syncResourceMetrics();

import('node/modules/apps/logs');
import('node/modules/apps/terminal');
import('node/modules/apps/app_center');
import('node/modules/apps/app_install');
import('node/modules/apps/mailserver');
import('node/modules/apps/nextcloud');
