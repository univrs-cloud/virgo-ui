import * as appService from 'node/modules/apps/services/app';

const DISCONNECTED_LABEL = 'Disconnected <a href="#" class="reconnect-logs link-underline link-underline-opacity-0 link-underline-opacity-75-hover ms-1">Connect</a>';

const socket = appService.getSocket();
const module = document.querySelector('#apps');
let containerId = null;
let serviceName = '';
let containerName = '';
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

	const link = event.target.closest('a');
	containerId = link.dataset.id;
	let service;
	_.each(appService.getApps(), (app) => {
		service = _.find(app.projectContainers, { id: containerId });
		if (service) {
			return false;
		}
	});
	containerName = _.replace(service?.names[0], /^\//, '');
	serviceName = service?.labels?.comDockerComposeService || service?.name || 'unknown';
	const app = link.closest('.item');
	logsContainer = app.querySelector('.logs-container');
	logsContainer.querySelector('.service .name').textContent = serviceName;
	logsContainer.classList.remove('d-none');
	setStatus('Connecting...');
	socket.emit('docker:container:logs:connect', containerId);
};

const closeLogs = (event) => {
	if (!event.target.closest('a')?.classList.contains('close-logs') && !event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	restore();
};

const restore = () => {
	if (!logsContainer) {
		return;
	}

	logsContainer.classList.add('d-none');
	socket.emit('docker:container:logs:disconnect');
	if (logs) {
		logs.removeEventListener('scroll', shouldScrollEvent);
	}
	logs = null;
	containerId = null;
	serviceName = '';
	containerName = '';
	logsContainer = null;
	isScrollEventAttached = false;
};

const reconnect = (event) => {
	if (!event.target.closest('a')?.classList.contains('reconnect-logs')) {
		return;
	}
	
	event.preventDefault();
	if (containerId && logsContainer) {
		setStatus('Connecting...');
		socket.emit('docker:container:logs:connect', containerId);
	}
};

const setStatus = (label, isLive = false) => {
	const liveIndicator = logsContainer?.querySelector('.service small');
	if (!liveIndicator) {
		return;
	}

	liveIndicator.classList.toggle('text-green-500', isLive);
	liveIndicator.classList.toggle('text-gray-500', !isLive);
	liveIndicator.innerHTML = `<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>${label}`;
};

const appendLine = (html) => {
	const li = document.createElement('li');
	li.innerHTML = html;
	logs.appendChild(li);
	if (shouldScroll) {
		logs.scrollTop = logs.scrollHeight;
	}
};

/** The list is resolved lazily because output or an error can arrive before the stream reports connected. */
const resolveLogs = () => {
	if (!logs && logsContainer) {
		logs = logsContainer.querySelector('ul');
		if (!isScrollEventAttached) {
			logs.addEventListener('scroll', shouldScrollEvent);
			isScrollEventAttached = true;
		}
	}
	return logs;
};

const shouldScrollEvent = (event) => {
	shouldScroll = (Math.abs(logs.scrollHeight - logs.scrollTop - logs.clientHeight) < 1);
}

const formatLogLine = (containerName, data) => {
	const dataStr = String(data || '').trim();
	// Color code log levels and status codes
	let formatted = escapeHtml(dataStr);
	formatted = colorizeLogLevels(formatted);
	formatted = colorizeStatusCodes(formatted);
	// Prepend container name if available
	if (containerName) {
		return `<span class="log-container-name text-blue-400">[${escapeHtml(containerName)}]</span><span class="log-content">${formatted}</span>`;
	}
	
	return `<span class="log-content">${formatted}</span>`;
}

const colorizeLogLevels = (text) => {
	return text.replace(
		/\blevel=(\w+)\b/g,
		(match, level) => {
			const colorClass = level === 'error' ? 'text-red-500' : level === 'warn' ? 'text-yellow-400' : level === 'info' ? 'text-blue-400' : level === 'debug' ? 'text-gray-500' : '';
			return `<span class="${colorClass}">level=${level}</span>`;
		}
	);
}

const colorizeStatusCodes = (text) => {
	return text.replace(
		/\bstatus_code=(\d+)\b/g,
		(match, code) => {
			const numCode = parseInt(code, 10);
			const colorClass = numCode >= 500 ? 'text-red-500' : numCode >= 400 ? 'text-orange-500' : numCode >= 300 ? 'text-yellow-400' : 'text-green-500';
			return `<span class="${colorClass}">status_code=${code}</span>`;
		}
	);
}

const escapeHtml = (text) => {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

socket.on('docker:container:logs:connected', () => {
	// Only a successful connect clears the list, so failed attempts keep accumulating feedback. The
	// stream replays its backlog on every connect, so keeping the old lines would just duplicate them.
	if (resolveLogs()) {
		logs.innerHTML = '';
	}
	setStatus('Live', true);
});
socket.on('docker:container:logs:output', (data) => {
	if (!resolveLogs()) {
		return;
	}

	appendLine(formatLogLine(containerName, String(data || '')));
});
socket.on('docker:container:logs:error', (error) => {
	if (!resolveLogs()) {
		return;
	}

	appendLine(`<span class="log-content text-red-500">${escapeHtml(error?.message || error)}</span>`);
	setStatus(DISCONNECTED_LABEL);
});
socket.on('disconnect', () => {
	setStatus(DISCONNECTED_LABEL);
});

module.addEventListener('click', render);
module.addEventListener('click', reconnect);
module.addEventListener('click', closeLogs);
module.addEventListener('details:hide', restore);
