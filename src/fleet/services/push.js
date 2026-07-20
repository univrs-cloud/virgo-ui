import FleetPush from 'stores/fleet_push';

// Service-worker registration + push-subscription orchestration for the fleet PWA. The network calls
// go through the fleet_push store; this layer owns the browser-side pieces (SW, Notification
// permission, PushManager) and is the only thing shell/fleet code touches.

const isSupported = () => {
	return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
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

// Ensure this install has a subscription and that the server has it on record. Assumes permission is
// already granted (caller's responsibility).
const subscribeAndSync = async (registration) => {
	const publicKey = await FleetPush.getVapidPublicKey();
	if (!publicKey) {
		return false;
	}
	const subscription = await registration.pushManager.getSubscription()
		|| await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey)
		});
	const result = await FleetPush.subscribe(subscription.toJSON());
	return result?.status === 'succeeded';
};

const isEnabled = async () => {
	if (!isSupported() || Notification.permission !== 'granted') {
		return false;
	}
	const registration = await navigator.serviceWorker.ready;
	return Boolean(await registration.pushManager.getSubscription());
};

// First-time opt-in: prompt for permission, then subscribe. Returns false if the user declines.
const enable = async () => {
	if (!isSupported()) {
		return false;
	}
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') {
		return false;
	}
	const registration = await register();
	return registration ? subscribeAndSync(registration) : false;
};

const disable = async () => {
	if (!isSupported()) {
		return;
	}
	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	if (!subscription) {
		return;
	}
	const { endpoint } = subscription;
	await subscription.unsubscribe();
	await FleetPush.unsubscribe(endpoint);
};

// Called on every fleet load: register the SW and, if the user already opted in, silently make sure
// this install's subscription is on record (it may be new, or the server may have pruned it). Never
// prompts — a fresh install with no prior permission does nothing until the user enables it.
const init = async () => {
	if (!isSupported()) {
		return;
	}
	
	const registration = await register();
	if (registration && Notification.permission === 'granted') {
		await subscribeAndSync(registration).catch(() => {});
	}
};

export {
	isSupported,
	isEnabled,
	enable,
	disable,
	init
};
