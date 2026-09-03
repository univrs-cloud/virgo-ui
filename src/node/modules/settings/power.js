import * as powerService from 'node/services/power';

const module = document.querySelector('#settings');

const reboot = async (event) => {
	if (event.target.dataset.action !== 'reboot') {
		return;
	}
	
	if (event.target.disabled) {
		return;
	}

	event.preventDefault();
	if (!await confirm('Are you sure you want to reboot?', { buttons: [{ text: 'Reboot', class: 'btn-danger' }] })) {
		return;
	}

	event.target.disabled = true;
	powerService.reboot();
};

const shutdown = async (event) => {
	if (event.target.dataset.action !== 'shut-down') {
		return;
	}

	if (event.target.disabled) {
		return;
	}

	event.preventDefault();
	if (!await confirm('Are you sure you want to shut down?', { buttons: [{ text: 'Shutdown', class: 'btn-danger' }] })) {
		return;
	}
	
	event.target.disabled = true;
	powerService.shutDown();
};

module.addEventListener('click', reboot);
module.addEventListener('click', shutdown);
