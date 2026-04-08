import modulePartial from 'modules/users/partials/index.html';
import userPartial from 'modules/users/partials/user.html';
import * as userService from 'modules/users/services/user';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const userTemplate = _.template(userPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#users');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'username',
	direction: 'asc'
};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const users = userService.getUsers();
		const jobs = userService.getJobs();
		render({ users, jobs });
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
	const jobs = userService.getJobs();
	render({ users, jobs });
};

const render = (state) => {
	if (_.isNull(state.users)) {
		return;
	}
	
	let users = state.users;
	users = filterListByQuery(users, searchValue, ['username', 'email', 'fullname', 'groups', 'shell', 'uid']);
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
		const isSameAsLoggedIn = (user.username === account?.user);
		return userTemplate({ user, jobs, isSameAsLoggedIn });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);

userService.subscribe([render]);

import('modules/users/user_create');
import('modules/users/user_update');
import('modules/users/user_password');
import('modules/users/user_delete');
import('modules/users/user_access_control');
