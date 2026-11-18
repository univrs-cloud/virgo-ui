import FleetBiometric from 'stores/fleet_biometric';

let nextRequestId = 0;

const ensureSucceeded = (result) => {
	if (result?.status !== 'succeeded') {
		throw new Error(result?.message || 'Something went wrong.');
	}
	return result;
};

const isInApp = () => {
	return Boolean(window.univrsFleet);
};

const callApp = (action, data = {}) => {
	return new Promise((resolve) => {
		const bridge = window.univrsFleet;
		nextRequestId += 1;
		const id = String(nextRequestId);
		const onMessage = (event) => {
			let reply = null;
			try {
				reply = JSON.parse(event.data);
			} catch (error) {
				return;
			}
			if (reply?.id !== id) {
				return;
			}
			bridge.removeEventListener('message', onMessage);
			resolve(reply);
		};
		bridge.addEventListener('message', onMessage);
		bridge.postMessage(JSON.stringify({ ...data, id, action }));
	});
};

const getStatus = async () => {
	if (!isInApp()) {
		return { available: false, enrolled: false };
	}
	const reply = await callApp('status');
	return { available: reply?.available === true, enrolled: reply?.enrolled === true };
};

const forget = async () => {
	if (isInApp()) {
		await callApp('forget');
	}
};

const enroll = async () => {
	const { available } = await getStatus();
	if (!available) {
		throw new Error('This device does not support biometric sign-in.');
	}
	const { challenge, challengeId } = ensureSucceeded(await FleetBiometric.registerOptions());
	const reply = await callApp('enroll', { challenge });
	if (reply?.status === 'cancelled') {
		return false;
	}
	ensureSucceeded(reply);
	try {
		ensureSucceeded(await FleetBiometric.registerVerify({
			challengeId,
			credentialId: reply.credentialId,
			publicKey: reply.publicKey,
			signature: reply.signature
		}));
	} catch (error) {
		await forget();
		throw error;
	}
	return true;
};

const authenticate = async () => {
	const { available, enrolled } = await getStatus();
	if (!available || !enrolled) {
		throw new Error('This device is not set up for biometric sign-in.');
	}
	const { challenge, challengeId } = ensureSucceeded(await FleetBiometric.authenticateOptions());
	const reply = await callApp('sign', { challenge });
	if (reply?.status === 'cancelled') {
		return false;
	}
	ensureSucceeded(reply);
	try {
		ensureSucceeded(await FleetBiometric.authenticateVerify({
			challengeId,
			credentialId: reply.credentialId,
			signature: reply.signature
		}));
	} catch (error) {
		await forget();
		throw error;
	}
	return true;
};

const disable = async () => {
	ensureSucceeded(await FleetBiometric.disable());
	await forget();
	return true;
};

export {
	isInApp,
	getStatus,
	enroll,
	authenticate,
	disable
};
