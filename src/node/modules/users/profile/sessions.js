import * as userService from 'node/modules/users/services/user';

const REFRESH_INTERVAL_MS = 60000;

const module = document.querySelector('#profile');

const revoke = async (link) => {
	if (!await confirm('Are you sure you want to sign this session out?', { buttons: [{ text: 'Sign out', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	try {
		const result = await userService.revokeSession({ id: Number(link.dataset.sessionId) });
		if (result?.status === 'succeeded') {
			notifier.add({ title: 'Session ended.', type: 'success' });
			return;
		}
		notifier.add({ title: result?.message || 'Failed to end the session.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || 'Failed to end the session.', type: 'error', duration: 0 });
	}
};

const revokeOthers = async () => {
	if (!await confirm('Are you sure you want to sign out all other sessions?', { buttons: [{ text: 'Sign out', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	try {
		const result = await userService.revokeAllSessions({ username: account.user });
		if (result?.status === 'succeeded') {
			notifier.add({ title: `${result.count} other ${_.pluralize('session', result.count)} ended.`, type: 'success' });
			return;
		}
		notifier.add({ title: result?.message || 'Failed to end the other sessions.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || 'Failed to end the other sessions.', type: 'error', duration: 0 });
	}
};

const onClick = (event) => {
	const link = event.target.closest('a');
	if (_.isNull(link)) {
		return;
	}

	if (link.classList.contains('revoke')) {
		event.preventDefault();
		revoke(link);
		return;
	}

	if (link.classList.contains('revoke-others')) {
		event.preventDefault();
		revokeOthers();
	}
};

const refresh = () => {
	userService.listSessions().catch(() => {});
};

refresh();

module.onRoute = refresh;
module.addEventListener('click', onClick);

setInterval(() => {
	if (!module.classList.contains('d-none')) {
		refresh();
	}
}, REFRESH_INTERVAL_MS);
