import modalPartial from 'fleet/sites/partials/modals/admin_add.html';
import * as nodeService from 'fleet/sites/services/node';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#admin-add');
const form = modal.querySelector('u-form');
let nodeId = null;

const render = (event) => {
	nodeId = event.relatedTarget?.dataset.nodeId ?? null;
};

const restore = () => {
	form.reset();
	nodeId = null;
};

const inviteAdmin = async () => {
	const buttons = form.querySelectorAll('.modal-footer u-button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	config.nodeId = nodeId;
	try {
		const result = await nodeService.inviteAdmin(config);
		if (result?.status === 'succeeded') {
			notifier.add({ title: `${config.email} invited as admin.`, type: 'success' });
			bootstrap.Modal.getInstance(modal)?.hide();
			return;
		}
		notifier.add({ title: result?.message || 'Failed to add admin.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: 'Failed to add admin.', type: 'error', duration: 0 });
	}
	_.each(buttons, (button) => { button.disabled = false; });
};

form.validation = [
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: 'Invalid email address'
		}
	}
];
form.addEventListener('valid', inviteAdmin);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
