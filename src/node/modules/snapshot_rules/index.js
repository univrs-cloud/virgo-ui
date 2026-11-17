import modulePartial from 'node/modules/snapshot_rules/partials/index.html';
import rulePartial from 'node/modules/snapshot_rules/partials/rule.html';
import snapshotsImage from 'assets/img/illustrations/snapshots.svg';
import noResultsImage from 'assets/img/illustrations/no-results.svg';
import * as snapshotRuleService from 'node/modules/snapshot_rules/services/snapshot_rule';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const ruleTemplate = _.template(rulePartial);
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
	let rules = filterListByQuery(state.rules, searchValue, ['name']);
	const total = _.size(state.rules);
	const noun = (total === 1 ? 'rule' : 'rules');
	listCount.textContent = (_.trim(searchValue) ? `${_.size(rules)} of ${total} ${noun}` : `${total} ${noun}`);
	rules = _.orderBy(rules, [(rule) => { return _.toLower(_.get(rule, tableOrder.field)); }], [tableOrder.direction]);
	const rows = _.join(_.map(rules, (rule) => {
		const jobs = _.filter(state.jobs, (job) => { return _.toLower(job.data?.config?.name ?? job.data?.config?.rule?.name) === _.toLower(rule.name); });
		return ruleTemplate({ rule, jobs, moment });
	}), '');

	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	const isEmpty = _.isEmpty(state.rules);
	const hasNoMatch = (!isEmpty && _.isEmpty(rules));
	tableScroll.classList.toggle('d-none', hasNoMatch);
	noResults.classList.toggle('d-none', !hasNoMatch);
	emptyList.classList.toggle('d-none', !isEmpty);
	container.classList.toggle('d-none', isEmpty);
};

searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);

snapshotRuleService.subscribe([render]);

import('node/modules/snapshot_rules/rule_create');
import('node/modules/snapshot_rules/rule_update');
import('node/modules/snapshot_rules/rule_delete');
