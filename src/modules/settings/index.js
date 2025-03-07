import modulePartial from 'modules/settings/partials/index.html';
import smtpPartial from 'modules/settings/partials/smtp.html';
import locationPartial from 'modules/settings/partials/location.html';
import powerPartial from 'modules/settings/partials/power.html';
import * as configurationService from 'modules/settings/services/configuration';

const moduleTemplate = _.template(modulePartial);
const smtpTemplate = _.template(smtpPartial);
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
			${smtpTemplate({ smtp: state.configuration?.smtp ?? null })}
			${locationTemplate({ location: state.configuration?.location ?? null })}
			${powerTemplate()}
		</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

render({ configuration: configurationService.getConfiguration() });

configurationService.subscribe([render]);

import('modules/settings/smtp');
import('modules/settings/location');
import('modules/settings/power');
