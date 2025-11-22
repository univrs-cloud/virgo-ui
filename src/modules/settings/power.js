import * as powerService from 'modules/settings/services/power';

const module = document.querySelector('#settings');

const reboot = async (event) => {
	if (event.target.dataset.action !== 'reboot') {
		return;
	}
	
	if (event.target.disabled) {
		return;
	}

	event.preventDefault();
	if (!await confirm('Are you sure you want to reboot?')) {
		return;
	}

	event.target.disabled = true;
	powerService.reboot();
};

const shutdown = async (event) => {
	if (event.target.dataset.action !== 'shut-down') {
		return;
	}

	if (event.targetdisabled) {
		return;
	}

	event.preventDefault();
	if (!await confirm('Are you sure you want to shut down?')) {
		return;
	}
	
	event.target.disabled = true;
	powerService.shutDown();
};

const render = (state) => {
	if (_.isNull(state.reboot) || _.isNull(state.shutdown)) {
		return;
	}

	const reboot = state.reboot;
	if (reboot) {
		document.body.classList.add('reboot');
		document.querySelector('#power .rebooting').classList.remove('d-none');
		document.querySelector('#power').classList.remove('d-none');
		return;
	}

	const shutdown = state.shutdown;
	if (shutdown) {
		document.querySelector('#power .powered-off').classList.remove('d-none');
		document.body.classList.add('powered-off');
		document.querySelector('#power').classList.remove('d-none');
		return;
	}

	document.body.classList.remove('reboot', 'powered-off');
	_.each(document.querySelectorAll('#power, #power .rebooting, #power .powered-off'), (element) => { element.classList.add('d-none') });
};

powerService.subscribe([render]);

module.addEventListener('click', reboot);
module.addEventListener('click', shutdown);
