import * as powerService from 'modules/settings/services/power';

let module = document.querySelector('#settings');

const reboot = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'reboot') {
		return;
	}
	
	if (event.target.closest('a').classList.contains('disabled')) {
		event.preventDefault();
		return;
	}

	event.preventDefault();
	if (!confirm('Are you sure you want to reboot?')) {
		return;
	}

	event.target.closest('a').classList.add('disabled');
	powerService.reboot();
};

const shutdown = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'shut-down') {
		return;
	}

	if (event.target.closest('a').classList.contains('disabled')) {
		return;
	}

	event.preventDefault();
	if (!confirm('Are you sure you want to shut down?')) {
		return;
	}
	
	event.target.closest('a').classList.add('disabled');
	powerService.shutDown();
};

const render = (state) => {
	if (_.isNull(state.reboot) || _.isNull(state.shutdown)) {
		return;
	}

	let reboot = state.reboot;
	if (reboot) {
		document.body.classList.add('reboot');
		document.querySelector('#power .rebooting').classList.remove('d-none');
		document.querySelector('#power').classList.remove('d-none');
		return;
	}

	let shutdown = state.shutdown;
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
