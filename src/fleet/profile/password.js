import modalPartial from 'fleet/profile/partials/modals/password.html';
import * as fleetAuthService from 'libs/services/fleet_auth';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#fleet-user-password');
const form = modal.querySelector('u-form');

const changePassword = async () => {
	const buttons = form.querySelectorAll('.modal-footer u-button');
	_.each(buttons, (button) => { button.disabled = true; });
	const { currentPassword, password } = form.getData();
	try {
		const result = await fleetAuthService.changePassword({ currentPassword, password });
		if (result?.status === 'succeeded') {
			// The password change invalidated the session and cleared the auth cookies, so reload
			// straight to the login screen.
			window.location.reload();
			return;
		}
		notifier.add({ title: result?.message || 'Failed to change password.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || 'Failed to change password.', type: 'error', duration: 0 });
	}
	_.each(buttons, (button) => { button.disabled = false; });
};

const restore = () => {
	form.reset();
};

const render = () => {
	form.querySelector('.title-email').innerHTML = account.email || '';
};

form.validation = [
	{
		selector: '.current-password',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`,
			isStrongPassword: {
				message: `At least 8 characters`,
				minLength: 8,
				minLowercase: 0,
				minUppercase: 0,
				minNumbers: 0,
				minSymbols: 0
			}
		}
	},
	{
		selector: '.password-check',
		rules: {
			isEmpty: `Can't be empty`,
			equals: {
				message: `Passwords do not match`,
				comparison: () => {
					return form.querySelector('.password').value;
				}
			}
		}
	}
];
form.addEventListener('valid', changePassword);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
