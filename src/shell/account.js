import accountPartial from 'shell/partials/account.html';
import * as dockerService from 'shell/services/docker';

const accountTemplate = _.template(accountPartial);
let authDomain = null;

const logout = (event) => {
	if (!event.target.classList.contains('sign-out') || !authDomain) {
		return;
	}
	
	event.preventDefault();
	location = `https://${authDomain}/logout`;
	// axios.post(`https://${authDomain}/api/logout`, null, { withCredentials: true })
	// 	.then(() => { })
	// 	.catch((error) => { })
	// 	.then(() => {
	// 		location.reload();
	// 	});
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
	render({ containers: dockerService.getContainers() });

	dockerService.subscribe([render]);

	document.body.addEventListener('click', logout);
};

export {
	init
};
