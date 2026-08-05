import modalPartial from 'fleet/sites/partials/modals/system_updates.html';
import updatesPartial from 'fleet/sites/partials/modals/system_updates_list.html';
import * as nodeService from 'fleet/sites/services/node';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const updatesTemplate = _.template(updatesPartial);
const modal = document.querySelector('#node-system-updates');
const updates = modal.querySelector('.updates');
const installButton = modal.querySelector('.install');
const sites = document.querySelector('#sites');
let nodeId = null;

const render = (event) => {
	nodeId = event.relatedTarget?.dataset.nodeId ?? null;
	const node = _.find(nodeService.getNodes() ?? [], { nodeId });
	updates.innerHTML = updatesTemplate({ updates: node?.updates?.system ?? [] });
	const hasUpdatingApps = !_.isEmpty(node?.appUpdateJobs);
	installButton.disabled = hasUpdatingApps;
	installButton.tip = (hasUpdatingApps ? 'An app update is in progress' : '');
};

const restore = () => {
	nodeId = null;
	updates.innerHTML = '';
	_.each(modal.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = false; });
};

const install = async () => {
	if (_.isNull(nodeId)) {
		return;
	}

	const buttons = modal.querySelectorAll('.modal-footer u-button');
	_.each(buttons, (button) => { button.disabled = true; });
	const node = _.find(nodeService.getNodes() ?? [], { nodeId });
	const name = node?.name ?? nodeId;
	try {
		const result = await nodeService.startSystemUpdate({ nodeId });
		if (result?.status === 'succeeded') {
			notifier.add({ title: `Installing system updates on ${name}.`, type: 'success' });
			bootstrap.Modal.getInstance(modal)?.hide();
			return;
		}
		notifier.add({ title: result?.message || `Failed to start system update on ${name}.`, type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || `Failed to start system update on ${name}.`, type: 'error', duration: 0 });
	}
	_.each(buttons, (button) => { button.disabled = false; });
};

// The green "update complete" badge in the grid finishes the update on the node — the same
// host:update:complete the node role's Continue button sends. Delegated because the grid re-renders;
// success needs no toast since the badge clears itself once the node reports the update gone.
const complete = async (event) => {
	const link = event.target.closest('[data-action="complete-update"]');
	if (_.isNull(link)) {
		return;
	}

	event.preventDefault();
	const targetNodeId = link.dataset.nodeId;
	const node = _.find(nodeService.getNodes() ?? [], { nodeId: targetNodeId });
	const name = node?.name ?? targetNodeId;
	try {
		const result = await nodeService.completeSystemUpdate({ nodeId: targetNodeId });
		if (result?.status !== 'succeeded') {
			notifier.add({ title: result?.message || `Failed to finish system update on ${name}.`, type: 'error', duration: 0 });
		}
	} catch (error) {
		notifier.add({ title: error.message || `Failed to finish system update on ${name}.`, type: 'error', duration: 0 });
	}
};

installButton.addEventListener('click', install);
sites.addEventListener('click', complete);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
