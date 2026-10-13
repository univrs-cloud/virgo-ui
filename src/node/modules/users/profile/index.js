import modulePartial from 'node/modules/users/profile/partials/index.html';
import profilePartial from 'node/modules/users/profile/partials/profile.html';
import sessionsPartial from 'node/modules/users/partials/sessions.html';
import * as userService from 'node/modules/users/services/user';

const moduleTemplate = _.template(modulePartial);
const profileTemplate = _.template(profilePartial);
const sessionsTemplate = _.template(sessionsPartial);
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
	const sessions = _.filter(state.sessions, (session) => { return _.toLower(session.username) === _.toLower(account.user); });
	const sessionsList = sessionsTemplate({ sessions, moment });

	morphdom(
		row,
		`<div>${profileTemplate({ user, sessions, sessionsList })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

userService.subscribe([render]);

import('node/modules/users/profile/profile');
import('node/modules/users/profile/password');
import('node/modules/users/profile/sessions');
