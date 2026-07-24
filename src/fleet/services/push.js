import FleetPush from 'stores/fleet_push';
import * as accountService from 'fleet/services/account';

// Service-worker registration + push-subscription orchestration for the fleet PWA. The network calls
// go through the fleet_push store; this layer owns the browser-side pieces (SW, Notification
// permission, PushManager). "Enabled" is an account-level intent carried in the account cookie (so it
// reflects across devices); each device still obtains its own (per-device) Notification permission.

let allowToast = null;

const isSupported = () => {
	return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

const getPermission = () => {
	return isSupported() ? Notification.permission : 'unsupported';
};

// VAPID keys travel as URL-safe base64; PushManager wants a Uint8Array.
const urlBase64ToUint8Array = (base64String) => {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		output[i] = raw.charCodeAt(i);
	}
	return output;
};

const register = async () => {
	if (!isSupported()) {
		return null;
	}

	await navigator.serviceWorker.register('/sw.js');
	return navigator.serviceWorker.ready;
};

// Create/confirm this device's subscription and record it server-side (which also flips the account
// preference on). Assumes permission is already granted.
const subscribeThisDevice = async () => {
	const publicKey = await FleetPush.getVapidPublicKey();
	if (!publicKey) {
		return false;
	}

	const registration = await register();
	if (!registration) {
		return false;
	}

	const subscription = await registration.pushManager.getSubscription()
		|| await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey)
		});
	const result = await FleetPush.enable(subscription.toJSON());
	if (result?.status === 'succeeded') {
		accountService.refresh();
		return true;
	}

	return false;
};

// Opt in on this device. Prompts for permission (must be called from a user gesture) and, if granted,
// subscribes. Returns the resulting permission ('granted' | 'denied' | 'default' | 'unsupported').
const allow = async () => {
	if (!isSupported()) {
		return 'unsupported';
	}

	const permission = await Notification.requestPermission();
	if (permission === 'granted') {
		await subscribeThisDevice();
	}
	return permission;
};

// Turn notifications off for the whole account (server clears the preference and every device's
// subscription), then drop this device's local subscription too.
const disable = async () => {
	await FleetPush.disable();
	// The response re-issued the account cookie (pushEnabled=false); pull it into the global.
	accountService.refresh();
	if (!isSupported()) {
		return;
	}
	const registration = await navigator.serviceWorker.getRegistration();
	const subscription = await registration?.pushManager.getSubscription();
	await subscription?.unsubscribe();
};

const isPromptDismissed = () => {
	try {
		return localStorage.getItem('fleet:notificationsPromptDismissed') === '1';
	} catch (error) {
		return false;
	}
};

const rememberPromptDismissed = () => {
	try {
		localStorage.setItem('fleet:notificationsPromptDismissed', '1');
	} catch (error) {
		// localStorage unavailable (private mode / blocked) — the toast just won't be remembered.
	}
};

// Shown on load when the account wants notifications but this device hasn't granted permission yet, and
// the user hasn't already dismissed this prompt. The button is a real user gesture, so
// requestPermission() works across browsers (an auto-prompt wouldn't on Firefox/Safari).
const showAllowToast = () => {
	if (allowToast || isPromptDismissed()) {
		return;
	}

	allowToast = notifier.add({
		title: 'To receive node alerts on this device, allow notifications.<br><br><u-button type="button" size="sm" click="grant">Allow notifications</u-button>',
		type: 'info',
		duration: 0,
		dismissible: true,
		onDismiss: () => {
			rememberPromptDismissed();
			allowToast = null;
		},
		callbacks: {
			grant: async ({ event, trigger }) => {
				if (trigger) {
					trigger.disabled = true;
				}
				const permission = await allow();
				if (permission === 'denied') {
					allowToast.update({ title: 'Notifications are blocked for this site. Allow them in your browser settings to receive notifications.', type: 'warning', duration: 0 });
				} else {
					allowToast.remove();
					allowToast = null;
				}
			}
		}
	});
};

// Called on every fleet load. Registers the SW and, if the account wants notifications, either
// re-subscribes this device silently (permission already granted) or prompts via the toast. Never
// auto-prompts; a fresh install with no account intent does nothing.
const init = async () => {
	if (!isSupported()) {
		return;
	}

	await register();
	if (!window.account?.pushEnabled) {
		return;
	}

	if (Notification.permission === 'granted') {
		await subscribeThisDevice().catch(() => {});
	} else if (Notification.permission === 'default') {
		showAllowToast();
	}
};

export {
	isSupported,
	getPermission,
	allow,
	disable,
	init
};
