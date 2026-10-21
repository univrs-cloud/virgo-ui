import headerPartial from 'node/partials/header.html';
import navigationPartial from 'node/partials/navigation.html';
import navigationWindowsPartial from 'node/partials/navigation_windows.html';
import nodePickerPartial from 'fleet/partials/node_picker.html';
import * as account from 'node/account';
import * as appService from 'node/services/app';
import * as softwareService from 'node/services/software';
import * as storageService from 'node/services/storage';
import * as nodeService from 'node/services/node';
import * as windowService from 'node/services/window';
import page from 'page';
import Sortable from 'sortablejs';
import { getNodeViewId } from 'node/view';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const navigationWindowsTemplate = _.template(navigationWindowsPartial);
const nodePickerTemplate = _.template(nodePickerPartial);
const header = document.querySelector('header');
let systemUpdates = 0;
let hasAppUpdates = false;
let hasStorageProblems = false;
let isStorageFull = false;

const setSystemUpdates = (state) => {
	systemUpdates = state.systemUpdates;
	renderNavigation();
};

const setAppUpdates = (state) => {
	hasAppUpdates = state.hasAppUpdates;
	renderNavigation();
};

const setStorageProblems = (state) => {
	hasStorageProblems = state.hasStorageProblems;
	isStorageFull = state.isStorageFull;
	renderNavigation();
};

const renderNavigation = () => {
	const newNav = `<div>${navigationTemplate({ active: page.current, systemUpdates, hasAppUpdates, hasStorageProblems, isStorageFull })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav, .drawer .navbar-nav'), (nav) => {
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
	const windows = `<div>${navigationWindowsTemplate({ windows: windowService.getWindows() })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav .windows'), (container) => {
		morphdom(container, windows, { childrenOnly: true });
	});
	syncActivePage();
};

const syncActivePage = () => {
	const isWindowPage = _.some(windowService.getWindows(), (item) => { return item.maximized && !item.minimized; });
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
		windowService.background();
	}
};

const handleWindowClick = (event) => {
	const link = event.target.closest('.nav-window');
	if (_.isNull(link)) {
		return;
	}

	event.preventDefault();
	if (event.target.closest('.close-window')) {
		bootstrap.Tooltip.getInstance(link)?.hide();
		windowService.close(link.dataset.windowId);
		return;
	}

	if (event.target.closest('.unmaximize-window')) {
		windowService.unmaximize(link.dataset.windowId);
		return;
	}

	windowService.toggle(link.dataset.windowId);
};

const reorderWindows = (event) => {
	event.item.style.opacity = '1';
	windowService.setOrder(_.map(event.to.querySelectorAll('.nav-window'), (link) => { return link.dataset.windowId; }));
};

const renderNodePicker = (state) => {
	if (_.isNull(state.nodes)) {
		return;
	}

	const nodeId = getNodeViewId();
	const currentNode = nodeId ? _.find(state.nodes, { nodeId }) : state.nodes[0];
	const currentNodeLabel = currentNode?.name || currentNode?.nodeId || '';
	_.each(document.querySelectorAll('header .navbar > .nodes, .drawer .drawer-title'), (container) => {
		const isDrawer = !_.isNull(container.closest('.drawer'));
		morphdom(container, `<div>${nodePickerTemplate({ nodes: state.nodes, currentNodeLabel, currentNodeId: nodeId, isDrawer })}</div>`, { childrenOnly: true });
	});
};

page.start();

morphdom(
	header,
	headerTemplate({ isUpdating: false })
);
renderNavigation();

account.init();

header.addEventListener('click', handleWindowClick);
header.addEventListener('click', handlePageClick);
document.addEventListener('update-mode', () => { windowService.closeAll({ persist: false }); });

softwareService.subscribeToUpdates([setSystemUpdates]);
if (isAdmin) {
	appService.subscribeToAppUpdates([setAppUpdates]);
	storageService.subscribeToStorageProblems([setStorageProblems]);
}
windowService.subscribe([renderWindows]);
new Sortable(header.querySelector('.navbar .nav .windows'), {
	animation: 150,
	onStart: (event) => {
		event.item.style.opacity = '0.5';
	},
	onEnd: reorderWindows
});

if (runtimeRole === 'fleet') {
	nodeService.subscribe([renderNodePicker]);
}
