import accountPartial from 'node/partials/account.html';
import * as dockerService from 'node/services/docker';
import * as sessionService from 'node/services/session';
import * as fleetAuthService from 'libs/services/fleet_auth';

let unsubscribe;
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

const render = (state) => {
	if (_.isNull(state.containers)) {
		return;
	}

	unsubscribe?.();
	unsubscribe = null;

	const isUpdating = !_.isNull(state.update);
	const newAccount = `<div>${accountTemplate({ account, isUpdating, runtimeRole })}</div>`;
	_.each(document.querySelectorAll('header .account'), (element) => {
		morphdom(element, newAccount, { childrenOnly: true });
	});
};

const init = () => {
	document.body.addEventListener('click', signOut);

	unsubscribe = dockerService.subscribe([render]);
};

export {
	init
};
