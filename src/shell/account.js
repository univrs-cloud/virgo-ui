import accountPartial from 'shell/partials/account.html';
import * as dockerService from 'shell/services/docker';

const accountTemplate = _.template(accountPartial);
let authDomain = null;

const logout = (event) => {
	if (!event.target.classList.contains('sign-out') || !authDomain) {
		return;
	}
	
	event.preventDefault();
	location = `${authDomain}/logout`;
};

const render = (state) => {
	if (_.isNull(state.containers)) {
		return;
	}
	
	let container = _.find(state.containers, { name: 'authelia' });
	authDomain = dockerService.composeUrlFromLabels(container?.labels);
	morphdom(
		document.querySelector('#account'),
		accountTemplate({ account, authDomain })
	);
};

const init = () => {
	document.body.addEventListener('click', logout);

	dockerService.subscribe([render]);
};

export {
	init
};
