import modulePartial from 'modules/users/partials/index.html';
import userPartial from 'modules/users/partials/user.html';
import * as userService from 'modules/users/services/user';

const moduleTemplate = _.template(modulePartial);
const userTemplate = _.template(userPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#users');
const loading = module.querySelector('.loading');
const searchInput = module.querySelector('.search');
const container = module.querySelector('.container-fluid');
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
		render({ users });
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
	render({ users });
};

// return _.orderBy(
// 	users,
// 	[(entity) => { return entity.fullname.toLowerCase(); }],
// 	['asc']
// );

const render = (state) => {
	if (_.isNull(state.users)) {
		return;
	}
	
	const template = document.createElement('template');
	let users = state.users;
	const searchTerms = searchValue.toLowerCase().split(/\s+/);
	users = _.filter(users, (user) => {
		const text = `${user.username || ''} ${user.email || ''} ${user.fullname || ''}`.toLowerCase();
		const matchesSearch = _.every(searchTerms, (term) => text.includes(term));
		return matchesSearch;
	});
	users = _.orderBy(users,
		[
			(user) => {
				const value = _.get(user, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	_.each(users, (user) => {
		template.innerHTML += userTemplate({ user });
	});
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${template.innerHTML}</tbody>`,
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
