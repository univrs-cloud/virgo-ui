import * as powerService from 'modules/settings/services/power';

const reboot = (event) => {
	if (!event.target.classList.contains('reboot')) {
		return;
	}
	
	if (event.target.classList.contains('disabled')) {
		return;
	}

	event.preventDefault();
	if (!confirm('Are you sure you want to reboot?')) {
		return;
	}

	event.target.classList.add('disabled');
	bootstrap.Modal.getInstance(event.target.closest('.modal'))?.hide();
	powerService.reboot();
};

const shutdown = (event) => {
	if (!event.target.classList.contains('shutdown')) {
		return;
	}

	if (event.target.classList.contains('disabled')) {
		return;
	}

	event.preventDefault();
	if (!confirm('Are you sure you want to shutdown?')) {
		return;
	}
	
	event.target.classList.add('disabled');
	bootstrap.Modal.getInstance(event.target.closest('.modal'))?.hide();
	powerService.shutdown();
};

const render = (state) => {
	if (_.isNull(state.reboot)) {
		return;
	}

	let reboot = state.reboot;
	if (reboot) {
		document.body.classList.add('reboot');
		document.querySelector('#power').classList.remove('d-none');
		return;
	}

	document.body.classList.remove('reboot');
	document.querySelector('#power').classList.add('d-none');
	document.querySelector('.reboot')?.classList.remove('disabled');
};

document.body.addEventListener('click', reboot);
document.body.addEventListener('click', shutdown);

powerService.subscribe([render]);
