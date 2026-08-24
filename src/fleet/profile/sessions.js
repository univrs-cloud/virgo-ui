import sessionsPartial from 'fleet/profile/partials/sessions.html';
import * as userService from 'fleet/profile/services/user';

// Nothing pushes when another device is used, so "active 2 minutes ago" would drift on a page left
// open. Re-reading on a timer refreshes the timestamps and re-renders through the store, and only
// runs while the module is on screen.
const REFRESH_INTERVAL_MS = 60000;

const sessionsTemplate = _.template(sessionsPartial);
const module = document.querySelector('#profile');
const container = module.querySelector('.sessions');

const render = (state) => {
	morphdom(
		container,
		sessionsTemplate({ sessions: state.sessions, moment })
	);
};

const revoke = async (link) => {
	if (!await confirm('Are you sure you want to sign this session out?', { buttons: [{ text: 'Sign out', class: 'btn-danger' }] })) {
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
	if (!await confirm('Are you sure you want to sign out all other sessions?', { buttons: [{ text: 'Sign out', class: 'btn-danger' }] })) {
		return;
	}

	try {
		const result = await userService.revokeOtherSessions();
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
	if (_.isNull(link) || !container.contains(link)) {
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

render({ sessions: userService.getSessions() });
userService.subscribe([render]);

module.onRoute = refresh;
module.addEventListener('click', onClick);

setInterval(() => {
	if (!module.classList.contains('d-none')) {
		refresh();
	}
}, REFRESH_INTERVAL_MS);
