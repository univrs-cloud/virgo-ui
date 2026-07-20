import FleetPush from 'stores/fleet_push';
import * as accountService from 'fleet/services/account';

// Service-worker registration + push-subscription orchestration for the fleet PWA. The network calls
// go through the fleet_push store; this layer owns the browser-side pieces (SW, Notification
// permission, PushManager). "Enabled" is an account-level intent carried in the account cookie (so it
// reflects across devices); each device still obtains its own (per-device) Notification permission.

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
		// The response re-issued the account cookie (pushEnabled=true); pull it into the global.
		accountService.refresh();
		return true;
	}
	return false;
};

// Opt in on this device. Prompts for permission (must be called from a user gesture) and, if granted,
// subscribes. Returns the resulting permission ('granted' | 'denied' | 'default' | 'unsupported').
const enable = async () => {
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

let enableToast = null;

// Shown on load when the account wants notifications but this device hasn't granted permission yet.
// The button is a real user gesture, so requestPermission() works across browsers (an auto-prompt
// wouldn't on Firefox/Safari).
const showEnableToast = () => {
	if (!window.notifier || enableToast) {
		return;
	}
	enableToast = notifier.add({ title: 'Allow notifications on this device to receive node update alerts.<br><button type="button" class="btn btn-sm btn-light mt-2" onclick="window.__enableFleetNotifications(this)">Enable notifications</button>', type: 'info', duration: 0 });
};

// Handler for the toast button. Global because the toast renders its message as raw HTML; matches how
// the app already exposes globals (notifier, account).
window.__enableFleetNotifications = async (button) => {
	if (button) {
		button.disabled = true;
	}
	const permission = await enable();
	enableToast?.remove();
	enableToast = null;
	if (permission === 'denied' && window.notifier) {
		notifier.add({ title: 'Notifications are blocked for this site. Allow them in your browser settings to receive alerts here.', type: 'warning', duration: 0 });
	}
	// A successful enable already refreshed the account global (which re-renders the profile toggle
	// and header via 'account-changed'); nothing more to do here.
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
		showEnableToast();
	}
	// 'denied': nothing to do here — the profile screen explains how to unblock.
};

export {
	isSupported,
	getPermission,
	enable,
	disable,
	init
};
