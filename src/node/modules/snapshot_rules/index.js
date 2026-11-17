import page from 'page';
import modulePartial from 'node/modules/snapshot_rules/partials/index.html';
import rulePartial from 'node/modules/snapshot_rules/partials/rule.html';
import ruleActionsPartial from 'node/modules/snapshot_rules/partials/rule_actions.html';
import ruleDetailsPartial from 'node/modules/snapshot_rules/partials/rule_details.html';
import snapshotsImage from 'assets/img/illustrations/snapshots.svg';
import ruleUnusedImage from 'assets/img/illustrations/rule-unused.svg';
import noResultsImage from 'assets/img/illustrations/no-results.svg';
import * as snapshotRuleService from 'node/modules/snapshot_rules/services/snapshot_rule';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const ruleTemplate = _.template(rulePartial);
const ruleActionsTemplate = _.template(ruleActionsPartial);
const ruleDetailsTemplate = _.template(ruleDetailsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ snapshotsImage, noResultsImage }));
const module = document.querySelector('#snapshot-rules');
const loading = module.querySelector('.loading');
const oops = module.querySelector('.oops');
const emptyList = module.querySelector('.empty-list');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const listCount = module.querySelector('.list-count');
const table = container.querySelector('.table');
const tableScroll = container.querySelector('.table-scroll');
const noResults = container.querySelector('.no-results');
const details = container.querySelector('.details');
let routeRuleName = null;
let rules = [];
const ruleTabs = {};
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'name',
	direction: 'asc'
};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const rules = snapshotRuleService.getRules();
		const jobs = snapshotRuleService.getJobs();
		render({ rules, jobs });
	}, 300);
};

const order = (event) => {
	if (_.isNull(event.target.closest('.orderable'))) {
		return;
	}

	const cell = event.target.closest('.orderable');
	tableOrder.field = cell.dataset.field;
	tableOrder.direction = (cell.classList.contains('asc') ? 'desc' : 'asc');
	_.each(table.querySelectorAll('thead th'), (cell) => { cell.classList.remove('asc', 'desc'); });
	cell.classList.add(tableOrder.direction);
	const rules = snapshotRuleService.getRules();
	const jobs = snapshotRuleService.getJobs();
	render({ rules, jobs });
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
	page(`/snapshot-rules/${encodeURIComponent(row.dataset.name)}`);
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/snapshot-rules');
};

const selectTab = (event) => {
	const button = event.target.closest('[data-rule-tab]');
	const name = button?.closest('.item')?.dataset?.name;
	if (!name) {
		return;
	}

	ruleTabs[name] = button.dataset.ruleTab;
	renderRuleDetails(name);
};

const clearRuleTabs = (name) => {
	_.each(_.keys(ruleTabs), (key) => {
		if (_.isUndefined(name) || _.toLower(key) === _.toLower(name)) {
			delete ruleTabs[key];
		}
	});
};

const filterJobsByRule = (jobs, rule) => {
	return _.filter(jobs, (job) => { return _.toLower(job.data?.config?.name ?? job.data?.config?.rule?.name) === _.toLower(rule.name); });
};

const renderRuleDetails = (name) => {
	if (!name) {
		return;
	}

	const rule = _.find(rules, (entry) => { return _.toLower(entry.name) === _.toLower(name); });
	if (!rule) {
		return;
	}

	const jobs = filterJobsByRule(snapshotRuleService.getJobs(), rule);
	morphdom(
		details,
		`<div>${ruleDetailsTemplate({ rule, jobs, ruleTab: ruleTabs[name] || 'members', ruleUnusedImage, ruleActionsTemplate, moment })}</div>`,
		{ childrenOnly: true }
	);
};

const hideRuleDetails = () => {
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.rules)) {
		return;
	}

	loading.classList.add('d-none');
	if (state.rules === false) {
		oops.classList.remove('d-none');
		emptyList.classList.add('d-none');
		container.classList.add('d-none');
		return;
	}

	oops.classList.add('d-none');
	rules = state.rules;
	let visibleRules = filterListByQuery(rules, searchValue, ['name']);
	const total = _.size(state.rules);
	const noun = (total === 1 ? 'rule' : 'rules');
	listCount.textContent = (_.trim(searchValue) ? `${_.size(visibleRules)} of ${total} ${noun}` : `${total} ${noun}`);
	visibleRules = _.orderBy(visibleRules, [(rule) => { return _.toLower(_.get(rule, tableOrder.field)); }], [tableOrder.direction]);
	const rows = _.join(_.map(visibleRules, (rule) => {
		const jobs = filterJobsByRule(state.jobs, rule);
		return ruleTemplate({ rule, jobs, ruleActionsTemplate, moment });
	}), '');

	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	if (routeRuleName && !_.some(state.rules, (rule) => { return _.toLower(rule.name) === _.toLower(routeRuleName); })) {
		page('/snapshot-rules');
	}

	const detailsRuleName = routeRuleName || container.querySelector('.details .item')?.dataset.name;
	if (detailsRuleName) {
		renderRuleDetails(detailsRuleName);
	}

	const isEmpty = _.isEmpty(state.rules);
	const hasNoMatch = (!isEmpty && _.isEmpty(visibleRules));
	tableScroll.classList.toggle('d-none', hasNoMatch);
	noResults.classList.toggle('d-none', !hasNoMatch);
	emptyList.classList.toggle('d-none', !isEmpty);
	container.classList.toggle('d-none', isEmpty);
};

const handleRoute = (ctx) => {
	const name = ctx?.params?.ruleName;
	routeRuleName = (_.isEmpty(name) ? null : name);
	if (_.isEmpty(name)) {
		clearRuleTabs();
		hideRuleDetails();
		return;
	}

	clearRuleTabs(name);
	renderRuleDetails(name);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', selectTab);
searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);

snapshotRuleService.subscribe([render]);

import('node/modules/snapshot_rules/rule_create');
import('node/modules/snapshot_rules/rule_update');
import('node/modules/snapshot_rules/rule_delete');
