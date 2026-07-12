import accountPartial from 'shell/partials/account.html';
import * as systemService from 'shell/services/system';
import * as dockerService from 'shell/services/docker';
import * as fleetAuthService from 'shell/services/fleet_auth';

let unsubscribe;
let authDomain = null;
const accountTemplate = _.template(accountPartial);

const signOut = async (event) => {
	if (!event.target.closest('a')?.classList.contains('sign-out')) {
		return;
	}

	if (runtimeRole === 'fleet') {
		event.preventDefault();
		await fleetAuthService.logout();
		window.location.reload();
		return;
	}

	if (!authDomain) {
		return;
	}

	event.preventDefault();
	location = `${authDomain}/logout?rd=https://${systemService.getFQDN()}`;
};

const render = (state) => {
	if (_.isNull(state.containers)) {
		return;
	}

	unsubscribe?.();
	unsubscribe = null;
	
	const isUpdating = !_.isNull(state.update);
	const projectContainers = _.filter(state.containers, (container) => {
		return container.labels && container.labels['comDockerComposeProject'] === 'authelia';
	});
	const urls = dockerService.composeUrlFromLabels(projectContainers);
	authDomain = urls.length > 0 ? urls[0] : null;
	morphdom(
		document.querySelector('#account'),
		accountTemplate({ account, authDomain, isUpdating, runtimeRole })
	);
};

const init = () => {
	document.body.addEventListener('click', signOut);

	unsubscribe = dockerService.subscribe([render]);
};

export {
	init
};
