import accountPartial from 'fleet/partials/account.html';
import * as fleetAuthService from 'libs/services/fleet_auth';

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
	const newAccount = `<div>${accountTemplate({ account })}</div>`;
	_.each(document.querySelectorAll('header .account'), (element) => {
		morphdom(element, newAccount, { childrenOnly: true });
	});
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
