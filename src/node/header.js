import headerPartial from 'node/partials/header.html';
import navigationPartial from 'node/partials/navigation.html';
import nodePickerPartial from 'fleet/partials/node_picker.html';
import * as account from 'node/account';
import * as softwareService from 'node/services/software';
import * as nodeService from 'node/services/node';
import page from 'page';
import { getNodeViewId } from 'node/view';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const nodePickerTemplate = _.template(nodePickerPartial);
const header = document.querySelector('header');

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

softwareService.subscribeToUpdates([renderNavigation]);

if (runtimeRole === 'fleet') {
	nodeService.subscribe([renderNodePicker]);
}
