import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import nodePickerPartial from 'shell/partials/fleet/node_picker.html';
import * as account from 'shell/account';
import * as notifications from 'shell/notifications';
import * as systemService from 'shell/services/system';
import * as softwareService from 'shell/services/software';
import * as nodeService from 'shell/services/node';
import page from 'page';
import { getNodeViewId } from 'libs/node_view';

let unsubscribe;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const nodePickerTemplate = _.template(nodePickerPartial);
const header = document.querySelector('header');

const renderSerialNumber = (state) => {
	if (_.isNull(state.system)) {
		return;
	}

	_.each(header.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system?.serial || '&mdash;'}`; });
	unsubscribe?.();
	unsubscribe = null;
};

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
				onBeforeElUpdated: (fromEl) => !fromEl.classList?.contains('nodes')
			}
		);
	});
};

const renderNodePicker = (state) => {
	if (_.isNull(state.nodes)) {
		return;
	}

	const nodeId = getNodeViewId();
	const currentNode = nodeId ? _.find(state.nodes, { nodeId }) : state.nodes[0];
	const currentNodeLabel = currentNode?.name || currentNode?.nodeId || '';
	const nodePicker = nodePickerTemplate({ nodes: state.nodes, currentNodeLabel });
	_.each(document.querySelectorAll('header .navbar .nav .nodes, .offcanvas .navbar-nav .nodes'), (container) => {
		container.innerHTML = nodePicker;
	});
};

page.start();

morphdom(
	header,
	headerTemplate({ isUpdating: false })
);
renderNavigation({ updates: [] });

account.init();
notifications.init();

softwareService.subscribeToUpdates([renderNavigation]);
unsubscribe = systemService.subscribe([renderSerialNumber]);

if (runtimeRole === 'fleet') {
	nodeService.subscribe([renderNodePicker]);
}

import('shell/weather');
