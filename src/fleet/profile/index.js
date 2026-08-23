import modulePartial from 'fleet/profile/partials/index.html';
import profilePartial from 'fleet/profile/partials/profile.html';

const moduleTemplate = _.template(modulePartial);
const profileTemplate = _.template(profilePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#profile');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const render = () => {
	morphdom(
		row,
		`<div>${profileTemplate({ account })}</div>`,
		{
			childrenOnly: true,
			// Both hints are runtime/per-device (browser permission, and whether this device holds a
			// passkey) rather than account state, so they're JS-managed — leave them untouched on
			// re-render. The toggles' checked state comes from the account in the template, so
			// morphdom can update those normally.
			onBeforeElUpdated: (fromEl) => {
				return !fromEl.classList?.contains('notifications-hint') && !fromEl.classList?.contains('biometrics-hint');
			}
		}
	);
};

render();
window.addEventListener('account-changed', render);

import('fleet/profile/profile');
import('fleet/profile/password');
import('fleet/profile/biometrics');
import('fleet/profile/notifications');
