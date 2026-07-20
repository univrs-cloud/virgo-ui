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
			// The permission hint is runtime/per-device (it depends on Notification.permission, not the
			// account), so it's JS-managed — leave it untouched on re-render. The toggle's checked state
			// comes from account.pushEnabled in the template, so morphdom can update it normally.
			onBeforeElUpdated: (fromEl) => {
				return !fromEl.classList?.contains('notifications-hint');
			}
		}
	);
};

render();
window.addEventListener('account-changed', render);

import('fleet/profile/profile');
import('fleet/profile/password');
import('fleet/profile/notifications');
