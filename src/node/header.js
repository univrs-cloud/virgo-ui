import headerPartial from 'node/partials/header.html';
import navigationPartial from 'node/partials/navigation.html';
import nodePickerPartial from 'fleet/partials/node_picker.html';
import * as account from 'node/account';
import * as notifications from 'node/notifications';
import * as systemService from 'node/services/system';
import * as softwareService from 'node/services/software';
import * as nodeService from 'node/services/node';
import page from 'page';
import { getNodeViewId } from 'node/view';

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

import('node/weather');
