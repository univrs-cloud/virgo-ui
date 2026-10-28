import * as configurationService from 'node/modules/settings/services/configuration';

const module = document.querySelector('#settings');

const updateArc = (event) => {
	if (!event.target.classList.contains('arc-max')) {
		return;
	}

	configurationService.updateArc({ max: Number(event.target.value) });
};

module.addEventListener('change', updateArc);
