import * as appService from 'modules/apps/services/app';

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

	const link = event.target;
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
	const app = link.closest('.app');
	logsContainer = app.querySelector('.logs-container');
	logsContainer.querySelector('.service .name').innerHTML = serviceName;
	logsContainer.classList.remove('d-none');
	socket.emit('logs:connect', containerId);
};

const closeLogs = (event) => {
	if (!event.target.closest('a')?.classList.contains('close-logs') && !event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	restore();
};

const restore = () => {
	if (logs) {
		logsContainer.classList.add('d-none');
		socket.emit('logs:disconnect');
		logs.removeEventListener('scroll', shouldScrollEvent);
		logs = null;
		containerId = null;
		serviceName = '';
		containerName = '';
		logsContainer = null;
		isScrollEventAttached = false;
	}
};

const reconnect = (event) => {
	if (!event.target.closest('a')?.classList.contains('reconnect-logs')) {
		return;
	}
	
	event.preventDefault();
	if (containerId && logsContainer) {
		socket.emit('logs:connect', containerId);
	}
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

socket.on('logs:connected', () => {
	if (!logs) {
		logs = logsContainer.querySelector('ul');
		logs.innerHTML = '';
		if (!isScrollEventAttached) {
			logs.addEventListener('scroll', shouldScrollEvent);
			isScrollEventAttached = true;
		}
	}
	// Update Live indicator
	if (logsContainer) {
		const liveIndicator = logsContainer.querySelector('.service small');
		if (liveIndicator) {
			liveIndicator.classList.remove('text-gray-500');
			liveIndicator.classList.add('text-green-500');
			liveIndicator.innerHTML = '<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>Live';
		}
	}
});
socket.on('logs:output', (data) => {
	if (logs) {
		const formattedLog = formatLogLine(containerName, String(data || ''));
		const li = document.createElement('li');
		li.innerHTML = formattedLog;
		logs.appendChild(li);
		if (!_.isNull(logs) && shouldScroll) {
			logs.scrollTop = logs.scrollHeight;
		}
	}
});
socket.on('logs:error', (error) => {
	if (logs) {
		logs.innerHTML = `<li><span class="log-content text-red-500">${escapeHtml(error.message)}</span></li>`;
	}
});
socket.on('disconnect', () => {
	// Update Live indicator to Disconnected (don't clear logs)
	if (logsContainer) {
		const liveIndicator = logsContainer.querySelector('.service small');
		if (liveIndicator) {
			liveIndicator.classList.remove('text-green-500');
			liveIndicator.classList.add('text-gray-500');
			liveIndicator.innerHTML = '<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>Disconnected <a href="#" class="reconnect-logs link-underline link-underline-opacity-0 link-underline-opacity-75-hover ms-1">Connect</a>';
		}
	}
});

module.addEventListener('click', render);
module.addEventListener('click', reconnect);
module.addEventListener('click', closeLogs);
