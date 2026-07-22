import page from 'page';
import headerPartial from 'node/partials/header.html';
import navigationPartial from 'node/partials/navigation_update.html';
import nodePickerPartial from 'fleet/partials/node_picker.html';
import updateStepsPartial from 'node/partials/update_steps.html';
import * as account from 'node/account';
import * as systemService from 'node/services/system';
import * as softwareService from 'node/services/software';
import * as nodeService from 'node/services/node';
import * as powerService from 'node/modules/settings/services/power';
import { getNodeViewId, getNodeViewBase, initNodeView } from 'node/view';

let unsubscribe;
let isScrollEventAttached = false;
let shouldScroll = true;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const nodePickerTemplate = _.template(nodePickerPartial);
const updateStepsTemplate = _.template(updateStepsPartial);
const header = document.querySelector('header');
const container = document.querySelector('#update');

initNodeView();

const complete = (event) => {
	if (event.target.dataset.action !== 'complete') {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.completeUpdate();
};

const reboot = async (event) => {
	if (event.target.dataset.action !== 'reboot') {
		return;
	}

	if (event.target.disabled) {
		return;
	}

	event.preventDefault();
	if (!await alert('A reboot is necessary to make recent changes take effect. The system will now reboot.')) {
		return;
	}

	event.target.disabled = true;
	powerService.reboot();
};

const renderSerialNumber = (state) => {
	_.each(document.querySelectorAll('header .serial-number'), (element) => { element.innerHTML = `SN:${state.system?.serial || '&mdash;'}`; });
	unsubscribe?.();
	unsubscribe = null;
};

const renderNavigation = async () => {
	_.each(header.querySelectorAll('.navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			`<div>${navigationTemplate()}</div>`,
			{ childrenOnly: true }
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

const render = (state) => {
	let update = state.update;
	if (_.isNull(update)) {
		location.replace(runtimeRole === 'node' ? '/' : (getNodeViewBase() || '/'));
		return;
	}

	document.querySelector('main').classList.add('d-none');
	if (!_.isUndefined(update.state) || !_.isEmpty(update.state)) {
		_.each(container.querySelectorAll(`.state:not(.${update.state})`), (element) => { element.classList.add('d-none'); });
		container.querySelector(`.state.${update.state}`).classList.remove('d-none');
		morphdom(
			container.querySelector('.steps'),
			updateStepsTemplate({ update })
		);
		const stepsList = container.querySelector('.steps ul');
		if (!isScrollEventAttached) {
			stepsList.addEventListener('scroll', (event) => {
				shouldScroll = (Math.abs(stepsList.scrollHeight - stepsList.scrollTop - stepsList.clientHeight) < 1);
			});
			isScrollEventAttached = true;
		}
		if (!_.isNull(stepsList) && shouldScroll) {
			stepsList.scrollTop = stepsList.scrollHeight;
		}
		container.classList.remove('d-none');
	}
};

morphdom(
	header,
	headerTemplate({ isUpdating: true })
);
renderNavigation();

account.init();

container.addEventListener('click', complete);
container.addEventListener('click', reboot);

page('*', (ctx) => {
	if (ctx.path !== '/') {
		page.redirect('/');
	}
});
page.start();

unsubscribe = systemService.subscribe([renderSerialNumber]);
softwareService.subscribeToUpdate([render]);

if (runtimeRole === 'fleet') {
	nodeService.subscribe([renderNodePicker]);
}
