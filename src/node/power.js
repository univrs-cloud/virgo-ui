import * as powerService from 'node/services/power';

const container = document.querySelector('#power');
let wasRebooting = false;

const render = (state) => {
	if (_.isNull(state.reboot) || _.isNull(state.shutdown)) {
		return;
	}

	if (state.reboot) {
		// In fleet mode the node is viewed through the fleet proxy under /nodes/{id}; once it starts
		// rebooting that view is unreachable, so return to the fleet root instead of showing the
		// on-node "Rebooting" overlay. Done here (after the backend confirms the reboot) so the
		// command is guaranteed sent before we navigate away.
		if (runtimeRole === 'fleet') {
			location.replace('/');
			return;
		}
		wasRebooting = true;
		document.body.classList.add('reboot');
		container.querySelector('.rebooting').classList.remove('d-none');
		container.classList.remove('d-none');
		return;
	}

	if (state.shutdown) {
		// Same as reboot: in fleet mode the node's proxied view is gone once it powers off (and it
		// won't come back on its own), so return to the fleet root instead of the on-node overlay.
		if (runtimeRole === 'fleet') {
			location.replace('/');
			return;
		}
		container.querySelector('.powered-off').classList.remove('d-none');
		document.body.classList.add('powered-off');
		container.classList.remove('d-none');
		return;
	}

	if (wasRebooting) {
		wasRebooting = false;
		location.reload();
		return;
	}

	document.body.classList.remove('reboot', 'powered-off');
	_.each([container, container.querySelector('.rebooting'), container.querySelector('.powered-off')], (element) => { element.classList.add('d-none') });
};

powerService.subscribe([render]);
