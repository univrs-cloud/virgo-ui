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
	const projectContainers = _.filter(state.containers, (container) => {
		return container.labels && container.labels['comDockerComposeProject'] === 'authelia';
	});
	const urls = dockerService.composeUrlFromLabels(projectContainers);
	authDomain = urls.length > 0 ? urls[0] : null;
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
