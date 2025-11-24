import accountPartial from 'shell/partials/account.html';
import * as systemService from 'shell/services/system';
import * as dockerService from 'shell/services/docker';

let subsciption;
let authDomain = null;
let fqdn = systemService.getFQDN();
const accountTemplate = _.template(accountPartial);

const signOut = (event) => {
	if (!authDomain || !event.target.closest('a')?.classList.contains('sign-out')) {
		return;
	}
	
	event.preventDefault();
	location = `${authDomain}/logout?rd=https://${fqdn}`;
};

const render = (state) => {
	if (_.isNull(state.containers)) {
		return;
	}

	dockerService.unsubscribe(subsciption);
	subsciption = null;
	
	const isUpdating = !_.isNull(state.update);
	const container = _.find(state.containers, { name: 'authelia' });
	authDomain = dockerService.composeUrlFromLabels(container?.labels);
	morphdom(
		document.querySelector('#account'),
		accountTemplate({ account, authDomain, isUpdating })
	);
};

const init = () => {
	document.body.addEventListener('click', signOut);

	subsciption = dockerService.subscribe([render]);
};

export {
	init
};
