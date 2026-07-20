import modulePartial from 'fleet/profile/partials/index.html';
import profilePartial from 'fleet/profile/partials/profile.html';

const moduleTemplate = _.template(modulePartial);
const profileTemplate = _.template(profilePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#profile');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

morphdom(
	row,
	`<div>${profileTemplate({ account })}</div>`,
	{ childrenOnly: true }
);

import('fleet/profile/profile');
import('fleet/profile/password');
import('fleet/profile/notifications');
