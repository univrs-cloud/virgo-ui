import * as appService from 'node/modules/apps/services/app';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const DISCONNECTED_LABEL = 'Disconnected <a href="#" class="reconnect-terminal link-underline link-underline-opacity-0 link-underline-opacity-75-hover ms-1">Connect</a>';

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

	const link = event.target.closest('a');
	let service;
	_.each(appService.getApps(), (app) => {
		service = _.find(app.projectContainers, { id: link.dataset.id });
		if (service) {
			return false;
		}
	});
	const app = link.closest('.item');
	terminalContainer = app.querySelector('.terminal-container');
	containerId = link.dataset.id;
	terminalContainer.querySelector('.service .name').textContent = service.labels?.comDockerComposeService;
	terminalContainer.classList.remove('d-none');
	setStatus('Connecting...');
	socket.emit('docker:container:terminal:connect', containerId);
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
	if (!terminalContainer) {
		return;
	}

	terminalContainer.classList.add('d-none');
	socket.emit('docker:container:terminal:disconnect');
	if (terminal) {
		terminal.dispose();
	}
	terminal = null;
	fitAddon = null;
	terminalContainer = null;
	containerId = null;
};

const setStatus = (label, isLive = false) => {
	const liveIndicator = terminalContainer?.querySelector('.service small');
	if (!liveIndicator) {
		return;
	}

	liveIndicator.classList.toggle('text-green-500', isLive);
	liveIndicator.classList.toggle('text-gray-500', !isLive);
	liveIndicator.innerHTML = `<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>${label}`;
};

const escapeHtml = (text) => {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
};

const reconnect = (event) => {
	if (!event.target.closest('a')?.classList.contains('reconnect-terminal')) {
		return;
	}
	
	event.preventDefault();
	if (containerId && terminalContainer) {
		setStatus('Connecting...');
		socket.emit('docker:container:terminal:connect', containerId);
	}
};

socket.on('docker:container:terminal:connected', () => {
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
		const wrapper = terminalContainer.querySelector('.wrapper');
		wrapper.innerHTML = '';
		terminal.open(wrapper);
		terminal.focus();
		terminal.onData((data) => {
			socket.emit('docker:container:terminal:input', data);
		});
		terminal.onResize((size) => {
			socket.emit('docker:container:terminal:resize', { cols: size.cols, rows: size.rows });
		});
		resize();
	} else {
		terminal.clear();
	}
	setStatus('Live', true);
});
socket.on('docker:container:terminal:output', (data) => {
	if (terminal) {
		terminal.write(data);
	}
});
socket.on('docker:container:terminal:error', (error) => {
	if (!terminalContainer) {
		return;
	}

	const message = error?.message || error;
	if (terminal) {
		terminal.write(`\r\n\x1b[31m${message}\x1b[0m\r\n`);
	} else {
		// The stream can fail before it ever connects (a container with no shell), so there is no
		// terminal to write into — put the reason in the wrapper rather than leaving it blank. Appended,
		// so a retry that fails again adds to the feedback instead of silently replacing it.
		terminalContainer.querySelector('.wrapper').insertAdjacentHTML('beforeend', `<div class="text-red-500 p-2">${escapeHtml(message)}</div>`);
	}
	setStatus(DISCONNECTED_LABEL);
});
socket.on('disconnect', () => {
	// Don't dispose the terminal — the reconnect link reuses it.
	setStatus(DISCONNECTED_LABEL);
});

module.addEventListener('click', render);
module.addEventListener('click', closeTerminal);
module.addEventListener('click', reconnect);
module.addEventListener('details:hide', restore);
window.addEventListener('resize', resize);
