import * as configurationService from 'node/modules/settings/services/configuration';

const module = document.querySelector('#settings');

const toggleFleet = (event) => {
	if (!event.target.classList.contains('fleet-switch')) {
		return;
	}

	if (event.target.checked) {
		configurationService.enableFleet();
	} else {
		configurationService.disableFleet();
	}
};

module.addEventListener('switch-changed', toggleFleet);
