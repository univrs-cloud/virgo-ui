import modulePartial from 'modules/users/profile/partials/index.html';
import profilePartial from 'modules/users/profile/partials/profile.html';

import * as userService from 'modules/users/services/user';

const moduleTemplate = _.template(modulePartial);
const profileTemplate = _.template(profilePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#profile');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.users)) {
		return;
	}

	let profile = _.find(state.users, { username: account.user });

	let template = document.createElement('template');
	template.innerHTML += profileTemplate({ profile, account });

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

import('modules/users/profile/profile');
import('modules/users/profile/password');
