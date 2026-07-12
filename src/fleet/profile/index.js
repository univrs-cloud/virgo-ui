import modulePartial from 'fleet/profile/partials/index.html';
import profilePartial from 'fleet/profile/partials/profile.html';

const moduleTemplate = _.template(modulePartial);
const profileTemplate = _.template(profilePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#profile');
const body = module.querySelector('.profile-body');

// The fleet account is display-only here (email + name from the auth cookie); there is no user
// list to subscribe to. Edit/change-password reload the page on success, which refreshes the cookie.
morphdom(
	body,
	`<div>${profileTemplate({ account })}</div>`,
	{ childrenOnly: true }
);

import('fleet/profile/profile');
import('fleet/profile/password');
