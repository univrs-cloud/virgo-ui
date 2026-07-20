import modalPartial from 'fleet/profile/partials/modals/edit.html';
import * as userService from 'fleet/profile/services/user';
import * as accountService from 'fleet/services/account';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#fleet-profile-edit');
const form = modal.querySelector('u-form');

const updateProfile = async () => {
	const buttons = form.querySelectorAll('.modal-footer u-button');
	_.each(buttons, (button) => { button.disabled = true; });
	const config = form.getData();
	try {
		const result = await userService.updateUser(config);
		if (result?.status === 'succeeded') {
			accountService.patch({ name: config.name });
			bootstrap.Modal.getInstance(modal)?.hide();
			return;
		}
		notifier.add({ title: result?.message || 'Failed to update profile.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || 'Failed to update profile.', type: 'error', duration: 0 });
		_.each(buttons, (button) => { button.disabled = false; });
	}
};

const restore = () => {
	form.reset();
};

const render = () => {
	form.querySelector('.title-email').innerHTML = account.email || '';
	form.querySelector('.name').value = account.name || '';
};

form.validation = [
	{
		selector: '.name',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', updateProfile);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
