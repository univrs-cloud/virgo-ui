import headerPartial from 'node/partials/header.html';
import navigationPartial from 'node/partials/navigation.html';
import navigationWindowsPartial from 'node/partials/navigation_windows.html';
import nodePickerPartial from 'fleet/partials/node_picker.html';
import * as account from 'node/account';
import * as softwareService from 'node/services/software';
import * as nodeService from 'node/services/node';
import page from 'page';
import { getNodeViewId } from 'node/view';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const navigationWindowsTemplate = _.template(navigationWindowsPartial);
const nodePickerTemplate = _.template(nodePickerPartial);
const header = document.querySelector('header');
const windowManager = document.querySelector('u-window-manager');

const renderNavigation = async (state) => {
	if (!state.updates) {
		return;
	}

	const newNav = `<div>${navigationTemplate({ active: page.current, updates: state.updates })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			newNav,
			{
				childrenOnly: true,
				onBeforeElUpdated: (fromEl) => !fromEl.classList?.contains('nodes') && !fromEl.classList?.contains('windows')
			}
		);
	});
	renderWindows();
};

const renderWindows = () => {
	const windows = `<div>${navigationWindowsTemplate({ windows: windowManager.windows })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav .windows'), (container) => {
		morphdom(container, windows, { childrenOnly: true });
	});
	syncActivePage();
};

const syncActivePage = () => {
	const isWindowPage = _.some(windowManager.windows, (item) => { return item.maximized && !item.minimized; });
	_.each(document.querySelectorAll('header .navbar .nav'), (nav) => {
		if (!nav.dataset.module) {
			return;
		}

		_.each(nav.querySelectorAll('.nav-link:not(.nav-window)'), (link) => {
			link.classList.toggle('active', !isWindowPage && link.getAttribute('href')?.toLowerCase() === `/${nav.dataset.module}`.toLowerCase());
		});
	});
};

const handlePageClick = (event) => {
	if (event.target.closest('.nav-link:not(.nav-window)')) {
		windowManager.background();
	}
};

const handleWindowClick = (event) => {
	const link = event.target.closest('.nav-window');
	if (_.isNull(link)) {
		return;
	}

	event.preventDefault();
	const item = document.getElementById(link.dataset.windowId);
	if (event.target.closest('.close-window')) {
		item?.close();
		return;
	}

	if (event.target.closest('.unmaximize-window')) {
		if (item) {
			item.maximized = false;
			item.restore();
		}
		return;
	}

	if ((item?.active || item?.maximized) && !item.minimized) {
		item.minimize();
		return;
	}

	item?.restore();
};

const renderNodePicker = (state) => {
	if (_.isNull(state.nodes)) {
		return;
	}

	const nodeId = getNodeViewId();
	const currentNode = nodeId ? _.find(state.nodes, { nodeId }) : state.nodes[0];
	const currentNodeLabel = currentNode?.name || currentNode?.nodeId || '';
	const nodePicker = `<div>${nodePickerTemplate({ nodes: state.nodes, currentNodeLabel, currentNodeId: nodeId })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav .nodes, .offcanvas .navbar-nav .nodes'), (container) => {
		morphdom(container, nodePicker, { childrenOnly: true });
	});
};

page.start();

morphdom(
	header,
	headerTemplate({ isUpdating: false })
);
renderNavigation({ updates: [] });

account.init();

header.addEventListener('click', handleWindowClick);
header.addEventListener('click', handlePageClick);
windowManager.addEventListener('windows-change', renderWindows);
document.addEventListener('update-mode', () => { windowManager.closeAll(); });

softwareService.subscribeToUpdates([renderNavigation]);

if (runtimeRole === 'fleet') {
	nodeService.subscribe([renderNodePicker]);
}
