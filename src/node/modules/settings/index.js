import modulePartial from 'node/modules/settings/partials/index.html';
import notificationsPartial from 'node/modules/settings/partials/notifications.html';
import locationPartial from 'node/modules/settings/partials/location.html';
import fleetPartial from 'node/modules/settings/partials/fleet.html';
import powerPartial from 'node/modules/settings/partials/power.html';
import * as configurationService from 'node/modules/settings/services/configuration';

const moduleTemplate = _.template(modulePartial);
const notificationsTemplate = _.template(notificationsPartial);
const locationTemplate = _.template(locationPartial);
const fleetTemplate = _.template(fleetPartial);
const powerTemplate = _.template(powerPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#settings');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.configuration)) {
		return;
	}
	
	morphdom(
		row,
		`<div>
			${notificationsTemplate({ smtp: state.configuration?.smtp || null })}
			${locationTemplate({ location: state.configuration?.location || null })}
			${fleetTemplate({ fleet: state.configuration?.fleet || null })}
			${powerTemplate()}
		</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

configurationService.subscribe([render]);

import('node/modules/settings/power');
import('node/modules/settings/notifications_update');
import('node/modules/settings/location_update');
import('node/modules/settings/fleet_update');
import('node/modules/settings/fleet_toggle');
