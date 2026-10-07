import * as appService from 'node/modules/apps/services/app';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';

const DISCONNECTED_LABEL = 'Disconnected <a href="#" class="reconnect-terminal link-underline link-underline-opacity-0 link-underline-opacity-75-hover ms-1">Connect</a>';
const SEARCH_OPTIONS = {
	decorations: {
		matchBackground: '#664d03',
		matchOverviewRuler: '#664d03',
		activeMatchBackground: '#fd7e14',
		activeMatchColorOverviewRuler: '#fd7e14'
	}
};
const SEARCH_THEME = {
	selectionInactiveBackground: '#fd7e14',
	selectionForeground: '#000000'
};

const socket = appService.getSocket();
const module = document.querySelector('#apps');
let containerId = null;
let terminalContainer = null;
let terminal = null;
let fitAddon = null;
let searchAddon = null;

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

const openSearch = (event) => {
	if (!terminal || terminalContainer.offsetParent === null || !(event.ctrlKey || event.metaKey) || _.toLower(event.key) !== 'f') {
		return;
	}

	event.preventDefault();
	event.stopPropagation();
	terminal.options.theme = SEARCH_THEME;
	const search = terminalContainer.querySelector('.search');
	search.classList.remove('d-none');
	const input = search.querySelector('input');
	input.focus();
	input.select();
};

const closeSearch = () => {
	const search = terminalContainer?.querySelector('.search');
	if (!search) {
		return;
	}

	search.classList.add('d-none');
	search.querySelector('input').value = '';
	search.querySelector('.results').textContent = '';
	searchAddon?.clearDecorations();
	if (terminal) {
		terminal.options.theme = {};
		terminal.focus();
	}
};

const find = (isPrevious = false, isIncremental = false) => {
	const search = terminalContainer?.querySelector('.search');
	if (!searchAddon || !search) {
		return;
	}

	const term = search.querySelector('input').value;
	if (!term) {
		searchAddon.clearDecorations();
		search.querySelector('.results').textContent = '';
		return;
	}

	if (isPrevious) {
		searchAddon.findPrevious(term, SEARCH_OPTIONS);
	} else {
		searchAddon.findNext(term, { ...SEARCH_OPTIONS, incremental: isIncremental });
	}
};

const typeSearch = (event) => {
	if (!event.target.closest('.terminal-container .search')) {
		return;
	}

	find(false, true);
};

const stepSearch = (event) => {
	if (!event.target.closest('.terminal-container .search')) {
		return;
	}

	const key = _.toLower(event.key);
	if (key === 'escape') {
		event.preventDefault();
		closeSearch();
	} else if (key === 'enter') {
		event.preventDefault();
		find(event.shiftKey);
	}
};

const clickSearch = (event) => {
	const button = event.target.closest('.terminal-container .search button');
	if (!button) {
		return;
	}

	if (button.classList.contains('close-search')) {
		closeSearch();
	} else {
		find(button.classList.contains('previous'));
	}
};

const setSearchResults = ({ resultIndex, resultCount }) => {
	const results = terminalContainer?.querySelector('.search .results');
	if (!results) {
		return;
	}

	results.textContent = !resultCount ? 'No results' : resultIndex < 0 ? `${resultCount} results` : `${resultIndex + 1} of ${resultCount}`;
};

const restore = () => {
	if (!terminalContainer) {
		return;
	}

	closeSearch();
	terminalContainer.classList.add('d-none');
	socket.emit('docker:container:terminal:disconnect');
	if (terminal) {
		terminal.dispose();
	}
	terminal = null;
	fitAddon = null;
	searchAddon = null;
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
		searchAddon = new SearchAddon();
		terminal = new Terminal({
			fontSize: 12,
			screenKeys: true,
			useStyle: true,
			cursorBlink: true,
			cursorStyle: 'bar',
			allowTransparency: true,
			allowProposedApi: true
		});
		terminal.loadAddon(fitAddon);
		terminal.loadAddon(searchAddon);
		terminal.loadAddon(new WebLinksAddon());
		searchAddon.onDidChangeResults(setSearchResults);
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
// The session ending on its own — the shell exited, or the stream failed — as opposed to this browser
// losing the socket. Both leave the terminal in place so the reconnect link can reuse it.
socket.on('docker:container:terminal:disconnected', () => {
	setStatus(DISCONNECTED_LABEL);
});
socket.on('disconnect', () => {
	// Don't dispose the terminal — the reconnect link reuses it.
	setStatus(DISCONNECTED_LABEL);
});

module.addEventListener('click', render);
module.addEventListener('click', closeTerminal);
module.addEventListener('click', reconnect);
module.addEventListener('click', clickSearch);
module.addEventListener('input', typeSearch);
module.addEventListener('keydown', stepSearch);
module.addEventListener('details:hide', restore);
window.addEventListener('resize', resize);
document.addEventListener('keydown', openSearch, true);
