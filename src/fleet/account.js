import accountPartial from 'fleet/partials/account.html';
import * as fleetAuthService from 'shell/services/fleet_auth';

const accountTemplate = _.template(accountPartial);

const signOut = async (event) => {
	if (!event.target.closest('a')?.classList.contains('sign-out')) {
		return;
	}

	event.preventDefault();
	await fleetAuthService.logout();
	window.location.reload();
};

const render = () => {
	morphdom(
		document.querySelector('#account'),
		accountTemplate({ account })
	);
};

const init = () => {
	render();
	document.body.addEventListener('click', signOut);
	// Re-render the dropdown (name/email/…) whenever the account global changes.
	window.addEventListener('account-changed', render);
};

export {
	init
};
