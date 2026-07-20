// The global `account` (window.account) is decoded from the display-only `account` cookie at
// bootstrap. This service keeps it in sync after a change and notifies the UI (header dropdown,
// profile) so they can re-render from the updated value instead of doing a full page reload.
// Fields like name, email and pushEnabled all ride along the same way.

const decode = () => {
	try {
		const encoded = document.cookie.match('(^|;)\\s*account\\s*=\\s*([^;]+)')?.pop();
		return JSON.parse(atob(encoded));
	} catch (error) {
		return {};
	}
};

const notify = () => {
	window.dispatchEvent(new CustomEvent('account-changed'));
};

const refresh = () => {
	window.account = decode();
	notify();
};

const patch = (changes) => {
	window.account = { ...(window.account || {}), ...changes };
	notify();
};

export {
	refresh,
	patch
};
