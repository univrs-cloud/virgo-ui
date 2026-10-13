import userSessionsModalPartial from 'node/modules/users/partials/modals/user_sessions.html';
import userSessionsContentPartial from 'node/modules/users/partials/modals/user_sessions_content.html';
import sessionsPartial from 'node/modules/users/partials/sessions.html';
import * as userService from 'node/modules/users/services/user';

const REFRESH_INTERVAL_MS = 60000;

const userSessionsContentTemplate = _.template(userSessionsContentPartial);
const sessionsTemplate = _.template(sessionsPartial);
document.querySelector('body').insertAdjacentHTML('beforeend', userSessionsModalPartial);

const module = document.querySelector('#users');
const modal = document.querySelector('#user-sessions');
let username = null;

const render = () => {
	if (_.isNull(username)) {
		return;
	}

	const user = _.find(userService.getUsers(), { username });
	if (_.isUndefined(user)) {
		bootstrap.Dialog.getInstance(modal)?.hide();
		return;
	}

	const sessions = _.filter(userService.getSessions(), (session) => { return _.toLower(session.username) === _.toLower(username); });
	const isSameAsLoggedIn = (user.username === account?.user);
	const sessionsList = sessionsTemplate({ sessions, moment });
	morphdom(
		modal.querySelector('.dialog-content'),
		userSessionsContentTemplate({ user, sessions, isSameAsLoggedIn, sessionsList })
	);
};

const open = (event) => {
	const uid = event.relatedTarget.closest('.item').dataset.uid;
	username = _.find(userService.getUsers(), { uid: Number(uid) })?.username ?? null;
	render();
};

const restore = () => {
	username = null;
};

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

const revokeAll = async () => {
	const isSameAsLoggedIn = (username === account?.user);
	const question = (isSameAsLoggedIn ? 'Are you sure you want to sign out all other sessions?' : `Are you sure you want to sign out all sessions of ${username}?`);
	if (!await confirm(question, { buttons: [{ text: 'Sign out', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	try {
		const result = await userService.revokeAllSessions({ username });
		if (result?.status === 'succeeded') {
			notifier.add({ title: `${result.count} ${_.pluralize('session', result.count)} ended.`, type: 'success' });
			return;
		}
		notifier.add({ title: result?.message || 'Failed to end the sessions.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || 'Failed to end the sessions.', type: 'error', duration: 0 });
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

	if (link.classList.contains('revoke-all')) {
		event.preventDefault();
		revokeAll();
	}
};

const refresh = () => {
	userService.listSessions().catch(() => {});
};

userService.subscribe([render]);

refresh();

module.onRoute = refresh;
modal.addEventListener('show.bs.dialog', open);
modal.addEventListener('hidden.bs.dialog', restore);
modal.addEventListener('click', onClick);

setInterval(() => {
	if (!module.classList.contains('d-none')) {
		refresh();
	}
}, REFRESH_INTERVAL_MS);
