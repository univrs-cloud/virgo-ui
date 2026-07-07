import modalPartial from 'shell/partials/fleet/modals/admin_add.html';
import * as nodeService from 'shell/services/node';

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

const inviteAdmin = () => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
	config.nodeId = nodeId;
	nodeService.inviteAdmin(config);
	bootstrap.Modal.getInstance(modal)?.hide();
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
