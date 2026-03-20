import * as serviceService from 'modules/system_services/services/service';

const socket = serviceService.getSocket();
const module = document.querySelector('#system-services');
let unit = null;
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
	unit = link.dataset.unit;
	const item = link.closest('.item');
	logsContainer = item.querySelector('.logs-container');
	logsContainer.querySelector('.service .name').innerHTML = unit;
	logsContainer.classList.remove('d-none');
	socket.emit('host:service:logs:connect', unit);
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
	socket.emit('host:service:logs:disconnect');
	if (logs) {
		logs.removeEventListener('scroll', shouldScrollEvent);
	}
	logs = null;
	unit = null;
	logsContainer = null;
	isScrollEventAttached = false;
};

const shouldScrollEvent = () => {
	shouldScroll = (Math.abs(logs.scrollHeight - logs.scrollTop - logs.clientHeight) < 1);
};

const formatLogLine = (data) => {
	const dataStr = String(data || '').trim();
	let formatted = escapeHtml(dataStr);
	formatted = colorizeLogLevels(formatted);
	formatted = colorizeStatusCodes(formatted);
	return `<span class="log-content">${formatted}</span>`;
};

const colorizeLogLevels = (text) => {
	return text.replace(
		/\blevel=(\w+)\b/g,
		(match, level) => {
			const colorClass = level === 'error' ? 'text-red-500' : level === 'warn' ? 'text-yellow-400' : level === 'info' ? 'text-blue-400' : level === 'debug' ? 'text-gray-500' : '';
			return `<span class="${colorClass}">level=${level}</span>`;
		}
	);
};

const colorizeStatusCodes = (text) => {
	return text.replace(
		/\bstatus_code=(\d+)\b/g,
		(match, code) => {
			const numCode = parseInt(code, 10);
			const colorClass = numCode >= 500 ? 'text-red-500' : numCode >= 400 ? 'text-orange-500' : numCode >= 300 ? 'text-yellow-400' : 'text-green-500';
			return `<span class="${colorClass}">status_code=${code}</span>`;
		}
	);
};

const escapeHtml = (text) => {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
};

socket.on('host:service:logs:connected', () => {
	if (!logs) {
		logs = logsContainer.querySelector('ul');
		logs.innerHTML = '';
		if (!isScrollEventAttached) {
			logs.addEventListener('scroll', shouldScrollEvent);
			isScrollEventAttached = true;
		}
	}
	if (logsContainer) {
		const liveIndicator = logsContainer.querySelector('.service small');
		if (liveIndicator) {
			liveIndicator.classList.remove('text-gray-500');
			liveIndicator.classList.add('text-green-500');
			liveIndicator.innerHTML = '<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>Live';
		}
	}
});

socket.on('host:service:logs:output', (data) => {
	if (logs) {
		const li = document.createElement('li');
		li.innerHTML = formatLogLine(String(data || ''));
		logs.appendChild(li);
		if (!_.isNull(logs) && shouldScroll) {
			logs.scrollTop = logs.scrollHeight;
		}
	}
});

socket.on('host:service:logs:error', (error) => {
	if (logs) {
		logs.innerHTML = `<li><span class="log-content text-red-500">${escapeHtml(error.message)}</span></li>`;
	}
});

socket.on('disconnect', () => {
	if (logsContainer) {
		const liveIndicator = logsContainer.querySelector('.service small');
		if (liveIndicator) {
			liveIndicator.classList.remove('text-green-500');
			liveIndicator.classList.add('text-gray-500');
			liveIndicator.innerHTML = '<i class="icon-solid icon-tower-broadcast icon-fw me-1"></i>Disconnected';
		}
	}
});

module.addEventListener('click', render);
module.addEventListener('click', closeLogs);
