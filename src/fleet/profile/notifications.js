import * as pushService from 'fleet/services/push';

const module = document.querySelector('#profile');
const toggle = module?.querySelector('.notifications-switch');
const hint = module?.querySelector('.notifications-hint');

const setHint = (text) => {
	if (hint) {
		hint.textContent = text;
	}
};

// Reflect the current state onto the toggle: unsupported / browser-blocked lock it off, otherwise it
// mirrors whether this install is subscribed.
const refresh = async () => {
	if (!pushService.isSupported()) {
		toggle.checked = false;
		toggle.disabled = true;
		setHint('Notifications are not supported on this device.');
		return;
	}
	if (Notification.permission === 'denied') {
		toggle.checked = false;
		toggle.disabled = true;
		setHint('Notifications are blocked in your browser settings.');
		return;
	}
	toggle.checked = await pushService.isEnabled();
	toggle.disabled = false;
	setHint('Get notified when your nodes have system or app updates.');
};

const onChange = async () => {
	toggle.disabled = true;
	try {
		if (toggle.checked) {
			const enabled = await pushService.enable();
			// Only surface an error for a real failure (e.g. server-side); a declined/dismissed
			// permission prompt isn't an error and the refreshed hint already explains the state.
			if (!enabled && Notification.permission === 'granted') {
				notifier.add({ title: 'Could not enable notifications.', type: 'error', duration: 0 });
			}
		} else {
			await pushService.disable();
		}
	} catch (error) {
		notifier.add({ title: 'Could not update notifications.', type: 'error', duration: 0 });
	}
	await refresh();
};

refresh();

toggle.addEventListener('switch-changed', onChange);
