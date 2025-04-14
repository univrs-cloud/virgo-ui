import * as appService from 'modules/apps/services/app';

const socket = appService.getSocket();
let module = document.querySelector('#apps');
let logsContainer = null;
let logs = null;
let isScrollEventAttached = false;
let shouldScroll = true;

const render = (event) => {
	if (!event.target.closest('a')?.classList.contains('logs')) {
		return;
	}

	event.preventDefault();
	restore();

	let link = event.target;
	let service;
	_.each(appService.getApps(), (app) => {
		service = _.find(app.projectContainers, { id: link.dataset.id });
		if (service) {
			return false;
		}
	});
	let app = link.closest('.app');
	logsContainer = app.querySelector('.logs-container');
	logsContainer.querySelector('.service .name').innerHTML = service.name;
	logsContainer.classList.remove('d-none');
	socket.emit('logsConnect', link.dataset.id);
};

const closeLogs = (event) => {
	if (!event.target.closest('a')?.classList.contains('close-logs') && !event.target.closest('span')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	restore();
};

const restore = () => {
	if (logs) {
		logsContainer.classList.add('d-none');
		socket.emit('logsDisconnect');
		logs.removeEventListener('scroll', shouldScrollEvent);
		logs = null;
		logsContainer = null;
		isScrollEventAttached = false;
	}
};

const shouldScrollEvent = (event) => {
	shouldScroll = (Math.abs(logs.scrollHeight - logs.scrollTop - logs.clientHeight) < 1);
}

socket.on('logsConnected', () => {
	if (!logs) {
		logs = logsContainer.querySelector('ul');
		logs.innerHTML = '';
		if (!isScrollEventAttached) {
			logs.addEventListener('scroll', shouldScrollEvent);
			isScrollEventAttached = true;
		}
	}
});
socket.on('logsOutput', (data) => {
	if (logs) {
		logs.innerHTML += `<li>${data}</li>`;
		if (!_.isNull(logs) && shouldScroll) {
			logs.scrollTop = logs.scrollHeight;
		}
	}
});
socket.on('logsError', (error) => {
	if (logs) {
		logs.innerHTML = `<li>${error.message}</li>`;
	}
});
socket.on('disconnect', () => {
	if (logs) {
		logs.innerHTML = '<li>Disconnected</li>';
	}
});

module.addEventListener('click', render);
module.addEventListener('click', closeLogs);
