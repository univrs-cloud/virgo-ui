import modalPartial from 'fleet/sites/partials/modals/system_updates.html';
import updatesPartial from 'fleet/sites/partials/modals/system_updates_list.html';
import * as nodeService from 'fleet/sites/services/node';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const updatesTemplate = _.template(updatesPartial);
const modal = document.querySelector('#node-system-updates');
const updates = modal.querySelector('.updates');
const installButton = modal.querySelector('.install');
let nodeId = null;

const render = (event) => {
	nodeId = event.relatedTarget?.dataset.nodeId ?? null;
	const node = _.find(nodeService.getNodes() ?? [], { nodeId });
	updates.innerHTML = updatesTemplate({ updates: node?.updates?.system ?? [] });
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
		const result = await nodeService.installSystemUpdate({ nodeId });
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

installButton.addEventListener('click', install);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
