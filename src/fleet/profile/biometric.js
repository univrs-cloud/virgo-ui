import * as accountService from 'fleet/services/account';
import * as biometricService from 'fleet/services/biometric';

const module = document.querySelector('#profile');
const toggle = module?.querySelector('.biometric-switch');
const hint = module?.querySelector('.biometric-hint');

const wireAdd = () => {
	const link = hint?.querySelector('.biometric-add');
	if (!link) {
		return;
	}

	link.addEventListener('click', async (event) => {
		event.preventDefault();
		await add();
		await refresh();
	});
};

const setHint = (html) => {
	if (hint) {
		hint.innerHTML = html;
		wireAdd();
	}
};

const refresh = async () => {
	const { available, enrolled } = await biometricService.getStatus();
	if (!available) {
		toggle.checked = false;
		toggle.disabled = true;
		setHint('This device has no fingerprint or face unlock set up. Sign in with your password and code.');
		return;
	}

	toggle.checked = Boolean(window.account?.biometricEnabled);
	toggle.disabled = false;

	if (!toggle.checked) {
		setHint('Sign in with your fingerprint or face instead of your password and code.');
	} else if (enrolled) {
		setHint(`This device is set up. You won't be asked for your password or code here.`);
	} else {
		setHint('Enabled on another device. <a href="#" class="biometric-add">Enroll this device</a> to use it here.');
	}
};

const add = async () => {
	try {
		if (!await biometricService.enroll()) {
			return false;
		}
		accountService.patch({ biometricEnabled: true });
		return true;
	} catch (error) {
		notifier.add({ title: error.message || 'Could not enroll this device.', type: 'error', duration: 0 });
		return false;
	}
};

const onChange = async () => {
	toggle.disabled = true;
	if (toggle.checked) {
		await add();
	} else {
		try {
			await biometricService.disable();
			accountService.patch({ biometricEnabled: false });
		} catch (error) {
			notifier.add({ title: error.message || 'Could not turn off biometric sign-in.', type: 'error', duration: 0 });
		}
	}
	await refresh();
};

refresh();

toggle.addEventListener('switch-changed', onChange);
window.addEventListener('account-changed', refresh);
