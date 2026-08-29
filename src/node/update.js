import page from 'page';
import headerPartial from 'node/partials/header.html';
import navigationPartial from 'node/partials/navigation_update.html';
import nodePickerPartial from 'fleet/partials/node_picker.html';
import updatePartial from 'node/partials/update.html';
import updateProgressPartial from 'node/partials/update_progress.html';
import * as account from 'node/account';
import * as softwareService from 'node/services/software';
import * as nodeService from 'node/services/node';
import * as powerService from 'node/modules/settings/services/power';
import { getNodeViewId, getNodeViewBase, initNodeView } from 'node/view';

let isScrollEventAttached = false;
let shouldScroll = true;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const nodePickerTemplate = _.template(nodePickerPartial);
const updateTemplate = _.template(updatePartial);
const updateProgressTemplate = _.template(updateProgressPartial);
const header = document.querySelector('header');
const main = document.querySelector('main');

main.insertAdjacentHTML('afterend', updateTemplate());
const container = document.querySelector('#update');
const row = container.querySelector('.row');

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
	const nodePicker = `<div>${nodePickerTemplate({ nodes: state.nodes, currentNodeLabel })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav .nodes, .offcanvas .navbar-nav .nodes'), (container) => {
		morphdom(container, nodePicker, { childrenOnly: true });
	});
};

const render = (state) => {
	let update = state.update;
	if (_.isNull(update)) {
		location.replace(runtimeRole === 'node' ? '/' : (getNodeViewBase() || '/'));
		return;
	}

	main.classList.add('d-none');
	if (!_.isUndefined(update.state) || !_.isEmpty(update.state)) {
		morphdom(
			row,
			`<div>${updateProgressTemplate({ update })}</div>`,
			{ childrenOnly: true }
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

softwareService.subscribeToUpdate([render]);

if (runtimeRole === 'fleet') {
	nodeService.subscribe([renderNodePicker]);
}
