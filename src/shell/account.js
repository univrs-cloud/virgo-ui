import accountPartial from 'shell/partials/account.html';
import * as authService from 'shell/services/auth';

let unsubscribe;
let authDomain = null;
const accountTemplate = _.template(accountPartial);

const signOut = async (event) => {
	if (!event.target.closest('a')?.classList.contains('sign-out')) {
		return;
	}

	event.preventDefault();

	if (isFleetMode) {
		await authService.logout();
		location.reload();
		return;
	}

	if (!authDomain) {
		return;
	}

	const { getFQDN } = await import('shell/services/system');
	location = `${authDomain}/logout?rd=https://${getFQDN()}`;
};

const render = async (state) => {
	const accountEl = document.querySelector('#account');
	if (!accountEl) {
		return;
	}

	if (isFleetMode) {
		morphdom(
			accountEl,
			accountTemplate({
				account,
				authDomain: null,
				isFleetMode: true,
				isUpdating: false
			})
		);
		return;
	}

	if (!state || _.isNull(state.containers)) {
		return;
	}

	unsubscribe?.();
	unsubscribe = null;

	const dockerService = await import('shell/services/docker');
	const isUpdating = !_.isNull(state.update);
	const projectContainers = _.filter(state.containers, (container) => {
		return container.labels && container.labels['comDockerComposeProject'] === 'authelia';
	});
	const urls = dockerService.composeUrlFromLabels(projectContainers);
	authDomain = urls.length > 0 ? urls[0] : null;
	morphdom(
		accountEl,
		accountTemplate({
			account,
			authDomain,
			isFleetMode: false,
			isUpdating
		})
	);
};

const init = () => {
	document.body.addEventListener('click', signOut);

	if (!isFleetMode) {
		import('shell/services/docker').then((dockerService) => {
			unsubscribe = dockerService.subscribe([render]);
		});
	}
};

export {
	init,
	render
};
