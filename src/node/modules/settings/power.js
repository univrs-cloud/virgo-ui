import * as powerService from 'node/modules/settings/services/power';

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

	if (event.targetdisabled) {
		return;
	}

	event.preventDefault();
	if (!await confirm('Are you sure you want to shut down?', { buttons: [{ text: 'Shutdown', class: 'btn-danger' }] })) {
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
		// In fleet mode the node is viewed through the fleet proxy under /nodes/{id}; once it starts
		// rebooting that view is unreachable, so return to the fleet root instead of showing the
		// on-node "Rebooting" overlay. Done here (after the backend confirms the reboot) so the
		// command is guaranteed sent before we navigate away.
		if (runtimeRole === 'fleet') {
			location.replace('/');
			return;
		}
		document.body.classList.add('reboot');
		document.querySelector('#power .rebooting').classList.remove('d-none');
		document.querySelector('#power').classList.remove('d-none');
		return;
	}

	const shutdown = state.shutdown;
	if (shutdown) {
		// Same as reboot: in fleet mode the node's proxied view is gone once it powers off (and it
		// won't come back on its own), so return to the fleet root instead of the on-node overlay.
		if (runtimeRole === 'fleet') {
			location.replace('/');
			return;
		}
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
