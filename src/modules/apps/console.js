import consoleModalPartial from 'modules/apps/partials/modal/console.html';
import * as appService from 'modules/apps/services/app';
import { Terminal } from '@xterm/xterm';

document.querySelector('body').insertAdjacentHTML('beforeend', consoleModalPartial);

const socket = appService.getSocket();
let modal = document.querySelector('#console');
let modalBody = modal.querySelector('.modal-body');
let terminal = null;

const render = (event) => {
	let link = event.relatedTarget;
	let card = link.closest('.console');
	socket.emit('terminalConnect', card.dataset.id);
};

const focus = (event) => {
	if (terminal) {
		terminal.focus();
	}
};

const restore = (event) => {
	if (terminal) {
		socket.emit('terminalDisconnect');
        terminal.dispose();
        terminal = null;
    }
};

modal.addEventListener('show.bs.modal', render);
modal.addEventListener('shown.bs.modal', focus);
modal.addEventListener('hidden.bs.modal', restore);

socket.on('terminalConnected', () => {
    if (!terminal) {
        terminal = new Terminal({
			screenKeys: true,
            useStyle: true,
            cursorBlink: true,
            cursorStyle: 'bar',
			allowTransparency: true,
			cols: 124,
			rows: 40
		});
        terminal.open(modalBody);
        terminal.onData((data) => {
            socket.emit('terminalInput', data);
        });
    } else {
        terminal.clear();
    }
});
socket.on('terminalOutput', (data) => {
    if (terminal) {
        terminal.write(data);
    }
});
socket.on('terminalError', (error) => {
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
