import * as appService from 'modules/apps/services/app';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const socket = appService.getSocket();
const module = document.querySelector('#apps');
let containerId = null;
let terminalContainer = null;
let terminal = null;
let fitAddon = null;

const render = (event) => {
	if (!event.target.closest('a')?.classList.contains('terminal')) {
		return;
	}

	event.preventDefault();
	restore();

	const link = event.target;
	let service;
	_.each(appService.getApps(), (app) => {
		service = _.find(app.projectContainers, { id: link.dataset.id });
		if (service) {
			return false;
		}
	});
	const app = link.closest('.app');
	terminalContainer = app.querySelector('.terminal-container');
	containerId = link.dataset.id;
	terminalContainer.querySelector('.service .name').innerHTML = service.labels?.comDockerComposeService;
	terminalContainer.classList.remove('d-none');
	socket.emit('terminal:connect', containerId);
};

const closeTerminal = (event) => {
	if (!event.target.closest('a')?.classList.contains('close-terminal') && !event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	restore();
};

const resize = (event) => {
	if (terminal) {
		fitAddon.fit();
	}
};

const restore = () => {
	if (terminal) {
		terminalContainer.classList.add('d-none');
		socket.emit('terminal:disconnect');
		terminal.dispose();
		terminal = null;
		fitAddon = null;
		terminalContainer = null;
		containerId = null;
	}
};

const reconnect = (event) => {
	if (!event.target.closest('a')?.classList.contains('reconnect-terminal')) {
		return;
	}
	
	event.preventDefault();
	if (containerId && terminalContainer) {
		socket.emit('terminal:connect', containerId);
	}
};

socket.on('terminal:connected', () => {
	if (!terminal) {
		fitAddon = new FitAddon();
		terminal = new Terminal({
			fontSize: 12,
			screenKeys: true,
			useStyle: true,
			cursorBlink: true,
			cursorStyle: 'bar',
			allowTransparency: true
		});
		terminal.loadAddon(fitAddon);
		terminal.open(terminalContainer.querySelector('.wrapper'));
		terminal.focus();
		terminal.onData((data) => {
			socket.emit('terminal:input', data);
		});
		terminal.onResize((size) => {
			socket.emit('terminal:resize', { cols: size.cols, rows: size.rows });
		});
		resize();
	} else {
		terminal.clear();
	}
	// Update Live indicator
	if (terminalContainer) {
		const liveIndicator = terminalContainer.querySelector('.service small');
		if (liveIndicator) {
			liveIndicator.classList.remove('text-gray-500');
			liveIndicator.classList.add('text-green-500');
			liveIndicator.innerHTML = '<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>Live';
		}
	}
});
socket.on('terminal:output', (data) => {
	if (terminal) {
		terminal.write(data);
	}
});
socket.on('terminal:rrror', (error) => {
	if (terminal) {
		terminal.dispose();
		terminal = null;
	}
});
socket.on('disconnect', () => {
	// Update Live indicator to Disconnected (don't dispose terminal)
	if (terminalContainer) {
		const liveIndicator = terminalContainer.querySelector('.service small');
		if (liveIndicator) {
			liveIndicator.classList.remove('text-green-500');
			liveIndicator.classList.add('text-gray-500');
			liveIndicator.innerHTML = '<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>Disconnected <a href="#" class="reconnect-terminal link-underline link-underline-opacity-0 link-underline-opacity-75-hover ms-1">Connect</a>';
		}
	}
});

module.addEventListener('click', render);
module.addEventListener('click', closeTerminal);
module.addEventListener('click', reconnect);
window.addEventListener('resize', resize);
