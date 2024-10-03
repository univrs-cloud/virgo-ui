import * as powerService from './services/power';

const reboot = (event) => {
	if (!event.target.classList.contains('reboot') || event.target.classList.contains('disabled')) {
		return;
	}

	event.preventDefault();
	if (!confirm('Are you sure you want to reboot?')) {
		return;
	}

	event.target.classList.add('disabled');
	powerService.reboot();
};

const shutdown = (event) => {
	if (!event.target.classList.contains('shutdown') || event.target.classList.contains('disabled')) {
		return;
	}

	event.preventDefault();
	if (!confirm('Are you sure you want to shutdown?')) {
		return;
	}
	
	event.target.classList.add('disabled');
	powerService.shutdown();
};

const render = (state) => {
	if (_.isNull(state.reboot)) {
		return;
	}

	let reboot = state.reboot;
	if (reboot) {
		_.each(document.body.querySelectorAll('#navbar, #weather, #account, .navbar-toggler, main, footer .navbar'), (element) => { element.classList.add('d-none'); });
		document.body.querySelector('#power').classList.remove('d-none');
		return;
	}

	document.body.querySelector('#power').classList.add('d-none');
	document.body.querySelector('.reboot')?.classList.remove('disabled');
	_.each(document.body.querySelectorAll('#navbar, #weather, #account, .navbar-toggler, main, footer .navbar'), (element) => { element.classList.remove('d-none'); });
};

document.body.addEventListener('click', reboot);
document.body.addEventListener('click', shutdown);

powerService.subscribe([render]);
