import headerPartial from 'fleet/partials/header.html';
import * as fleetAuthService from 'shell/services/fleet_auth';

const header = document.querySelector('header');
const headerTemplate = _.template(headerPartial);

const signOut = async (event) => {
	if (!event.target.closest('a')?.classList.contains('sign-out')) {
		return;
	}

	event.preventDefault();
	await fleetAuthService.logout();
	window.location.reload();
};

morphdom(
	header,
	headerTemplate()
);

header.addEventListener('click', signOut);
