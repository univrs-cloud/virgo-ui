import modulePartial from 'modules/users/profile/partials/index.html';
import profilePartial from 'modules/users/profile/partials/profile.html';

import * as userService from 'modules/users/services/user';

const moduleTemplate = _.template(modulePartial);
const profileTemplate = _.template(profilePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#profile');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.users)) {
		return;
	}

	const user = _.find(state.users, { username: account.user });
	const template = document.createElement('template');
	template.innerHTML += profileTemplate({ user: user });

	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

userService.subscribe([render]);

import('modules/users/profile/profile');
import('modules/users/profile/password');
