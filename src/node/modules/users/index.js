import page from 'page';
import modulePartial from 'node/modules/users/partials/index.html';
import userPartial from 'node/modules/users/partials/user.html';
import userActionsPartial from 'node/modules/users/partials/user_actions.html';
import userDetailsPartial from 'node/modules/users/partials/user_details.html';
import sessionsPartial from 'node/modules/users/partials/sessions.html';
import noResultsImage from 'assets/img/illustrations/no-results.svg';
import * as userService from 'node/modules/users/services/user';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const userTemplate = _.template(userPartial);
const userActionsTemplate = _.template(userActionsPartial);
const userDetailsTemplate = _.template(userDetailsPartial);
const sessionsTemplate = _.template(sessionsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ noResultsImage }));
const module = document.querySelector('#users');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const listCount = module.querySelector('.list-count');
const table = container.querySelector('.table');
const tableScroll = container.querySelector('.table-scroll');
const noResults = container.querySelector('.no-results');
const details = container.querySelector('.details');
let routeUid = null;
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'username',
	direction: 'asc'
};
const userTabs = {};

const openProfile = async (event) => {
	const link = event.target.closest('a[href="/users/profile"]');
	if (!link) {
		return;
	}

	event.preventDefault();
	await bootstrap.Tooltip.getInstance(link)?.hide();
	page(link.getAttribute('href'));
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
	page(`/users/${row.dataset.uid}`);
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/users');
};

const selectTab = (event) => {
	const button = event.target.closest('[data-user-tab]');
	const uid = button?.closest('.item')?.dataset?.uid;
	if (!uid) {
		return;
	}

	userTabs[uid] = button.dataset.userTab;
	renderUserDetails(uid);
};

const renderUserDetails = (uid) => {
	if (!uid) {
		return;
	}

	const user = _.find(userService.getUsers(), { uid: Number(uid) });
	if (!user) {
		return;
	}

	const jobs = _.filter(userService.getJobs(), (job) => { return job.data?.config?.username === user.username; });
	const sessions = _.filter(userService.getSessions(), (session) => { return _.toLower(session.username) === _.toLower(user.username); });
	const isSameAsLoggedIn = (user.username === account?.user);
	const sessionsList = sessionsTemplate({ sessions, moment });
	morphdom(
		details,
		`<div>${userDetailsTemplate({ user, jobs, sessions, isSameAsLoggedIn, sessionsList, userActionsTemplate, userTab: userTabs[uid] || 'overview' })}</div>`,
		{ childrenOnly: true }
	);
};

const hideUserDetails = () => {
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const handleRoute = (ctx) => {
	userService.listSessions().catch(() => {});
	const uid = ctx?.params?.uid;
	routeUid = (_.isEmpty(uid) ? null : uid);
	_.each(_.keys(userTabs), (key) => {
		if (key !== routeUid) {
			delete userTabs[key];
		}
	});
	if (_.isNull(routeUid)) {
		hideUserDetails();
		return;
	}

	renderUserDetails(routeUid);
	details.classList.add('d-block');
};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const users = userService.getUsers();
		const sessions = userService.getSessions();
		const jobs = userService.getJobs();
		render({ users, sessions, jobs });
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
	const users = userService.getUsers();
	const sessions = userService.getSessions();
	const jobs = userService.getJobs();
	render({ users, sessions, jobs });
};

const render = (state) => {
	if (_.isNull(state.users)) {
		return;
	}
	
	let users = state.users;
	users = filterListByQuery(users, searchValue, ['username', 'email', 'fullname', 'groups', 'shell', 'uid']);
	const total = _.size(state.users);
	const noun = (total === 1 ? 'user' : 'users');
	listCount.textContent = (_.trim(searchValue) ? `${_.size(users)} of ${total} ${noun}` : `${total} ${noun}`);
	users = _.orderBy(users,
		[
			(user) => {
				const value = _.get(user, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	const rows = _.join(_.map(users, (user) => {
		const jobs = _.filter(state.jobs, (job) => { return job.data?.config?.username === user.username; });
		const sessions = _.filter(state.sessions, (session) => { return _.toLower(session.username) === _.toLower(user.username); });
		const isSameAsLoggedIn = (user.username === account?.user);
		return userTemplate({ user, sessions, jobs, isSameAsLoggedIn, userActionsTemplate });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	if (routeUid && !_.some(state.users, { uid: Number(routeUid) })) {
		page('/users');
	}

	const detailsUid = routeUid || container.querySelector('.details .item')?.dataset.uid;
	if (detailsUid) {
		renderUserDetails(detailsUid);
	}

	const hasNoMatch = (!_.isEmpty(state.users) && _.isEmpty(users));
	tableScroll.classList.toggle('d-none', hasNoMatch);
	noResults.classList.toggle('d-none', !hasNoMatch);
	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', openProfile);
table.querySelector('tbody').addEventListener('click', expand);
module.addEventListener('click', compress);
module.addEventListener('click', selectTab);
module.onRoute = handleRoute;

userService.subscribe([render]);

import('node/modules/users/user_create');
import('node/modules/users/user_update');
import('node/modules/users/user_password');
import('node/modules/users/user_delete');
import('node/modules/users/user_access_control');
import('node/modules/users/user_sessions');
