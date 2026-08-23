import * as accountService from 'fleet/services/account';
import * as webauthnService from 'fleet/services/webauthn';

const module = document.querySelector('#profile');
const toggle = module?.querySelector('.biometrics-switch');
const hint = module?.querySelector('.biometrics-hint');

// Enrolling a second device doesn't change the account-level flag, so it can't ride on the toggle.
// It gets this link instead — the same shape as the notifications permission hint.
const wireAdd = () => {
	const link = hint?.querySelector('.passkey-add');
	if (!link) {
		return;
	}

	link.addEventListener('click', async (event) => {
		event.preventDefault();
		await add();
		refresh();
	});
};

const setHint = (html) => {
	if (hint) {
		hint.innerHTML = html;
		wireAdd();
	}
};

// The toggle mirrors the account-level state (any device enrolled); the hint covers whether *this*
// device is one of them, which the account can't tell us — it's held in local storage by the
// service that enrolled it.
const refresh = () => {
	if (!webauthnService.isSupported()) {
		toggle.checked = false;
		toggle.disabled = true;
		setHint('Biometric sign-in is not supported on this device.');
		return;
	}

	toggle.checked = Boolean(window.account?.passkeyEnabled);
	toggle.disabled = false;

	if (!toggle.checked) {
		setHint('Sign in with your fingerprint or face instead of your password and code.');
	} else if (webauthnService.isEnrolledOnThisDevice()) {
		setHint(`This device is enrolled — you won't be asked for your password or code here.`);
	} else {
		setHint('Enabled on another device. <a href="#" class="passkey-add">Enroll this device</a> to use it here.');
	}
};

// Shared by the toggle and the "enroll this device" link. Returns false when the user dismissed the
// system prompt, which is a cancellation and not worth a notification.
const add = async () => {
	try {
		if (!await webauthnService.enroll()) {
			return false;
		}
		accountService.patch({ passkeyEnabled: true });
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
			// Account-wide: every enrolled device loses access, which is what makes this the switch to
			// reach for when one of them is lost.
			await webauthnService.disable();
			accountService.patch({ passkeyEnabled: false });
		} catch (error) {
			notifier.add({ title: error.message || 'Could not turn off biometric sign-in.', type: 'error', duration: 0 });
		}
	}
	refresh();
};

refresh();

toggle.addEventListener('switch-changed', onChange);
window.addEventListener('account-changed', refresh);
