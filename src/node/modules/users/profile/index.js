import modulePartial from 'node/modules/users/profile/partials/index.html';
import profilePartial from 'node/modules/users/profile/partials/profile.html';
import * as userService from 'node/modules/users/services/user';

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

	morphdom(
		row,
		`<div>${profileTemplate({ user })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

userService.subscribe([render]);

import('node/modules/users/profile/profile');
import('node/modules/users/profile/password');
