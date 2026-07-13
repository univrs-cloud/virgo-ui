import challengePartial from 'fleet/partials/mfa_challenge.html';
import * as fleetAuthService from 'shell/services/fleet_auth';

export const mount = () => {
	const main = document.querySelector('main');
	main.innerHTML = challengePartial;

	const challengeForm = main.querySelector('u-form.challenge');
	const recoveryForm = main.querySelector('u-form.recovery');

	// challengeForm sends { code }, recoveryForm sends { recoveryCode }; the server checks whichever
	// is present. On success the session becomes satisfied, so a full navigation lands on the app.
	const submit = (form) => async () => {
		const button = form.querySelector('u-button[type="submit"]');
		button.disabled = true;
		try {
			const result = await fleetAuthService.mfaVerify(form.getData());
			if (result?.status !== 'succeeded') {
				throw new Error(result?.message || 'That code is not valid.');
			}
			window.location.replace('/');
		} catch (error) {
			notifier.add({ title: error.message, type: 'error', duration: 0 });
			button.disabled = false;
		}
	};

	const toggle = (show, hide) => (event) => {
		event.preventDefault();
		hide.reset();
		hide.classList.add('d-none');
		show.classList.remove('d-none');
	};

	const signOut = async (event) => {
		event.preventDefault();
		await fleetAuthService.logout();
		window.location.replace('/signin');
	};

	challengeForm.validation = [{ selector: '.code', rules: { isEmpty: `Can't be empty` } }];
	recoveryForm.validation = [{ selector: '.recovery-code', rules: { isEmpty: `Can't be empty` } }];
	challengeForm.addEventListener('valid', submit(challengeForm));
	recoveryForm.addEventListener('valid', submit(recoveryForm));
	main.querySelector('.show-recovery').addEventListener('click', toggle(recoveryForm, challengeForm));
	main.querySelector('.show-challenge').addEventListener('click', toggle(challengeForm, recoveryForm));
	main.querySelector('.sign-out').addEventListener('click', signOut);
};
