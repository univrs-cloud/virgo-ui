import modalPartial from 'fleet/profile/partials/modals/edit.html';
import * as userService from 'fleet/profile/services/user';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#fleet-profile-edit');
const form = modal.querySelector('u-form');

const updateProfile = async () => {
	const buttons = form.querySelectorAll('.modal-footer u-button');
	_.each(buttons, (button) => { button.disabled = true; });
	const { fullname } = form.getData();
	try {
		const result = await userService.updateUser({ fullname });
		if (result?.status === 'succeeded') {
			// Reload so the refreshed account cookie (new name) propagates to the header and the card.
			window.location.reload();
			return;
		}
		notifier.add({ title: result?.message || 'Failed to update profile.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: 'Failed to update profile.', type: 'error', duration: 0 });
	}
	_.each(buttons, (button) => { button.disabled = false; });
};

const restore = () => {
	form.reset();
};

const render = () => {
	form.querySelector('.title-email').innerHTML = account.email || '';
	form.querySelector('.fullname').value = account.name || '';
};

form.validation = [
	{
		selector: '.fullname',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', updateProfile);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
