import modulePartial from 'modules/settings/partials/index.html';
import notificationsPartial from 'modules/settings/partials/notifications.html';
import locationPartial from 'modules/settings/partials/location.html';
import powerPartial from 'modules/settings/partials/power.html';
import * as configurationService from 'modules/settings/services/configuration';

const moduleTemplate = _.template(modulePartial);
const notificationsTemplate = _.template(notificationsPartial);
const locationTemplate = _.template(locationPartial);
const powerTemplate = _.template(powerPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());

let module = document.querySelector('#settings');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.configuration)) {
		return;
	}

	morphdom(
		row,
		`<div>
			${notificationsTemplate({ smtp: state.configuration?.smtp ?? null })}
			${locationTemplate({ location: state.configuration?.location ?? null })}
			${powerTemplate()}
		</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

configurationService.subscribe([render]);

import('modules/settings/notifications_update');
import('modules/settings/location_update');
import('modules/settings/power');
