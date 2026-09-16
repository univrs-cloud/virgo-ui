import * as connectionService from 'fleet/services/connection';

const GRACE_MS = 3000;
const RELOAD_PROMPT_MS = 60000;

let toast = null;
let showTimer = null;
let reloadTimer = null;
let wasConnected = false;

const show = () => {
	showTimer = null;
	toast = notifier.add({
		title: 'Connection lost. Trying to reconnect...',
		type: 'warning',
		duration: 0,
		dismissible: false,
		callbacks: {
			reload: () => {
				location.reload();
			}
		}
	});
	reloadTimer = setTimeout(() => {
		toast?.update({ title: 'Still trying to reconnect.<br><br><u-button type="button" size="sm" click="reload">Reload</u-button>' });
	}, RELOAD_PROMPT_MS);
};

const hide = () => {
	clearTimeout(showTimer);
	clearTimeout(reloadTimer);
	showTimer = null;
	reloadTimer = null;
	toast?.remove();
	toast = null;
};

const render = (state) => {
	if (state.connected) {
		wasConnected = true;
		hide();
		return;
	}

	if (!wasConnected || showTimer || toast) {
		return;
	}

	showTimer = setTimeout(show, GRACE_MS);
};

connectionService.subscribe([render]);
