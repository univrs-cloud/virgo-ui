import modulePartial from 'modules/users/partials/index.html';
import emptyPartial from 'modules/users/partials/empty.html';
import userPartial from 'modules/users/partials/user.html';
import * as userService from 'modules/users/services/user';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const userTemplate = _.template(userPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#users');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.users)) {
		return;
	}
	
	let template = document.createElement('template');
	if (_.isEmpty(state.users)) {
		template.innerHTML = emptyTemplate();
	} else {
		_.each(state.users, (user) => {
			template.innerHTML += userTemplate({ user });
		});
	}
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

render({ users: userService.getUsers() });

userService.subscribe([render]);

import('modules/users/user_create');
import('modules/users/user_update');
import('modules/users/user_password');
import('modules/users/user_delete');
