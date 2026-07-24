import * as pushService from 'fleet/services/push';

const module = document.querySelector('#profile');
const toggle = module?.querySelector('.notifications-switch');
const hint = module?.querySelector('.notifications-hint');

// The retry/enable link (denied or not-yet-allowed states) re-runs the permission request; on a
// gesture it can prompt again once the user has reset a blocked permission in their browser.
const wireRetry = () => {
	const link = hint?.querySelector('.push-retry');
	if (!link) {
		return;
	}
	
	link.addEventListener('click', async (event) => {
		event.preventDefault();
		await pushService.allow();
		await refresh();
	});
};

const setHint = (html) => {
	if (hint) {
		hint.innerHTML = html;
		wireRetry();
	}
};

// The toggle mirrors the account-level preference (shared across devices); the hint explains this
// device's permission, which is separate and can't be granted remotely.
const refresh = async () => {
	const permission = pushService.getPermission();
	if (permission === 'unsupported') {
		toggle.checked = false;
		toggle.disabled = true;
		setHint('Notifications are not supported on this device.');
		return;
	}

	toggle.checked = Boolean(window.account?.pushEnabled);
	toggle.disabled = false;

	if (!toggle.checked) {
		setHint('Get notified when your nodes have updates or storage issues.');
	} else if (permission === 'granted') {
		setHint(`You'll receive node alerts on this device.`);
	} else if (permission === 'denied') {
		setHint('Blocked on this device. Reset it in your browser settings, then <a href="#" class="push-retry">try again</a>.');
	} else {
		setHint('Allow notifications on this device to receive alerts here. <a href="#" class="push-retry">Allow</a>.');
	}
};

const onChange = async () => {
	toggle.disabled = true;
	try {
		if (toggle.checked) {
			const permission = await pushService.allow();
			if (permission === 'denied') {
				notifier.add({ title: 'Notifications are blocked for this site. Allow them in your browser settings.', type: 'warning', duration: 0 });
			}
		} else {
			await pushService.disable();
		}
	} catch (error) {
		notifier.add({ title: error.message || 'Could not update notifications.', type: 'error', duration: 0 });
	}
	await refresh();
};


refresh();

toggle.addEventListener('switch-changed', onChange);
window.addEventListener('account-changed', refresh);
