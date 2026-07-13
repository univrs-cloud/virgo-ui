import setupPartial from 'fleet/partials/mfa_setup.html';
import * as fleetAuthService from 'shell/services/fleet_auth';
import QRCode from 'qrcode';

export const mount = () => {
	const main = document.querySelector('main');
	main.innerHTML = setupPartial;

	const setupPanel = main.querySelector('.setup');
	const recoveryPanel = main.querySelector('.recovery');
	const verifyForm = main.querySelector('u-form.verify');
	const qrImg = main.querySelector('.qr');
	const secretEl = main.querySelector('.secret');

	// Ask the server for a fresh secret, then render the otpauth URI as a QR the app can scan.
	const begin = async () => {
		try {
			const result = await fleetAuthService.mfaSetup();
			if (result?.status !== 'succeeded') {
				throw new Error(result?.message || 'Could not start two-factor setup.');
			}
			qrImg.src = await QRCode.toDataURL(result.otpauthUrl, { margin: 1, width: 180 });
			secretEl.textContent = result.secret;
		} catch (error) {
			notifier.add({ title: error.message, type: 'error', duration: 0 });
		}
	};

	const showRecovery = (codes) => {
		const list = recoveryPanel.querySelector('.recovery-codes');
		codes.forEach((code) => {
			const item = document.createElement('li');
			item.textContent = code;
			list.appendChild(item);
		});
		setupPanel.classList.add('d-none');
		recoveryPanel.classList.remove('d-none');

		recoveryPanel.querySelector('.download').addEventListener('click', (event) => {
			event.preventDefault();
			const blob = new Blob([`${codes.join('\n')}\n`], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'virgo-fleet-recovery-codes.txt';
			link.click();
			URL.revokeObjectURL(url);
		});
		// Session is now satisfied; full navigation re-reads the cookie and the router shows the app.
		recoveryPanel.querySelector('.continue').addEventListener('click', () => window.location.replace('/'));
	};

	const verify = async () => {
		const button = verifyForm.querySelector('u-button[type="submit"]');
		button.disabled = true;
		try {
			const result = await fleetAuthService.mfaSetupVerify(verifyForm.getData());
			if (result?.status !== 'succeeded') {
				throw new Error(result?.message || 'Verification failed.');
			}
			showRecovery(result.recoveryCodes || []);
		} catch (error) {
			notifier.add({ title: error.message, type: 'error', duration: 0 });
			button.disabled = false;
		}
	};

	const signOut = async (event) => {
		event.preventDefault();
		await fleetAuthService.logout();
		window.location.replace('/signin');
	};

	verifyForm.validation = [
		{ selector: '.code', rules: { isEmpty: `Can't be empty` } }
	];
	verifyForm.addEventListener('valid', verify);
	main.querySelector('.sign-out').addEventListener('click', signOut);

	begin();
};
