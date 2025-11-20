import * as appService from 'modules/apps/services/app';
import { Terminal } from '@xterm/xterm';
import { CanvasAddon } from '@xterm/addon-canvas';
import { FitAddon } from '@xterm/addon-fit';

const socket = appService.getSocket();
const module = document.querySelector('#apps');
let terminalContainer = null;
let terminal = null;
let fitAddon = null;

const render = (event) => {
	if (!event.target.closest('a')?.classList.contains('console')) {
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
	terminalContainer.querySelector('.service .name').innerHTML = service.name;
	terminalContainer.classList.remove('d-none');
	socket.emit('terminal:connect', link.dataset.id);
};

const closeTerminal = (event) => {
	if (!event.target.closest('a')?.classList.contains('close-terminal') && !event.target.closest('span')?.classList.contains('compress')) {
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
	}
};

socket.on('terminal:connected', () => {
	if (!terminal) {
		fitAddon = new FitAddon();
		terminal = new Terminal({
			screenKeys: true,
			useStyle: true,
			cursorBlink: true,
			cursorStyle: 'bar',
			allowTransparency: true
		});
		terminal.loadAddon(new CanvasAddon());
		terminal.loadAddon(fitAddon);
		terminal.open(terminalContainer);
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
	if (terminal) {
		terminal.dispose();
		terminal = null;
	}
});

module.addEventListener('click', render);
module.addEventListener('click', closeTerminal);
window.addEventListener('resize', resize);
