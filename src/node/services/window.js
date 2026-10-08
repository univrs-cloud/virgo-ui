import * as updateMode from 'libs/update_mode';

const WINDOWS_KEY = 'windows:open';
const windowManager = document.querySelector('u-window-manager');
let callbacks = [];
let order = [];

const getWindows = () => {
	const windows = _.sortBy(windowManager.windows, (item) => {
		const index = _.indexOf(order, item.id);
		return index === -1 ? Number.MAX_SAFE_INTEGER : index;
	});
	return _.map(windows, (item) => {
		return {
			id: item.id,
			label: item.label,
			icon: item.icon,
			type: item.type,
			url: item.dataset.src ?? null,
			maximized: item.maximized,
			minimized: item.minimized,
			active: item.active,
			width: item.width,
			height: item.height
		};
	});
};

const getWindow = (id) => {
	return windowManager.querySelector(`:scope > #${CSS.escape(id)}`);
};

const subscribe = (subscribers) => {
	callbacks = _.concat(callbacks, subscribers);
	_.each(subscribers, (callback) => { callback({ windows: getWindows() }); });
	return () => {
		callbacks = _.difference(callbacks, subscribers);
	};
};

const open = (options) => {
	return !_.isNull(windowManager.open(options));
};

const close = (id) => {
	getWindow(id)?.close();
};

const closeAll = () => {
	windowManager.closeAll();
};

const toggle = (id) => {
	const item = getWindow(id);
	if ((item?.active || item?.maximized) && !item.minimized) {
		item.minimize();
		return;
	}

	item?.restore();
};

const unmaximize = (id) => {
	const item = getWindow(id);
	if (!item) {
		return;
	}

	item.maximized = false;
	item.restore();
};

const setOrder = (ids) => {
	order = ids;
	emit();
};

const background = () => {
	windowManager.background();
};

const save = (windows) => {
	if (!windowManager.available || updateMode.isActive()) {
		return;
	}

	const stored = _.map(_.filter(windows, 'url'), (item) => { return _.pick(item, ['label', 'icon', 'type', 'url', 'maximized', 'width', 'height']); });
	try {
		localStorage.setItem(WINDOWS_KEY, JSON.stringify(stored));
	} catch (error) {
		return;
	}
};

const restore = () => {
	if (!isAuthenticated) {
		return;
	}

	let stored = null;
	try {
		stored = JSON.parse(localStorage.getItem(WINDOWS_KEY));
	} catch (error) {
		stored = null;
	}
	_.each(_.filter(stored, (item) => { return _.isString(item?.url); }), (item) => {
		windowManager.open({ ..._.pick(item, ['label', 'icon', 'type', 'url', 'maximized', 'width', 'height']), minimized: true });
	});
};

const emit = () => {
	const windows = getWindows();
	save(windows);
	_.each(callbacks, (callback) => { callback({ windows }); });
};

windowManager.addEventListener('windows-change', emit);

restore();

export {
	subscribe,
	getWindows,
	open,
	close,
	closeAll,
	toggle,
	unmaximize,
	setOrder,
	background
};
