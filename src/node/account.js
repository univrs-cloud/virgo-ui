import accountPartial from 'node/partials/account.html';
import * as softwareService from 'node/services/software';
import * as sessionService from 'node/services/session';
import * as fleetAuthService from 'libs/services/fleet_auth';

let isInitialized = false;
const accountTemplate = _.template(accountPartial);

// The node ends its own sessions now that it starts them: the browser is reloaded rather than routed,
// so the shell rebuilds itself for whoever is left.
const signOut = async (event) => {
	if (!event.target.closest('a')?.classList.contains('sign-out')) {
		return;
	}

	event.preventDefault();
	if (runtimeRole === 'fleet') {
		await fleetAuthService.logout();
		window.location.reload();
		return;
	}

	if (!await sessionService.logout()) {
		notifier.add({ title: 'Could not sign out.', type: 'error', duration: 0 });
		return;
	}

	window.location.reload();
};

const paint = (update) => {
	if (update === -1) {
		return;
	}

	const isUpdating = !_.isNull(update);
	const newAccount = `<div>${accountTemplate({ account, isUpdating, runtimeRole })}</div>`;
	_.each(document.querySelectorAll('header .account'), (element) => {
		morphdom(element, newAccount, { childrenOnly: true });
	});
};

const render = (state) => {
	paint(state.update);
};

const init = () => {
	if (!isInitialized) {
		isInitialized = true;
		document.body.addEventListener('click', signOut);
		softwareService.subscribeToUpdate([render]);
	}

	paint(softwareService.getUpdate());
};

export {
	init
};
