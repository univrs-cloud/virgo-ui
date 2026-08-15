import loginPartial from 'node/partials/login.html';
import * as sessionService from 'node/services/session';

// Written into the shell's own main, which is already the full height of the page, so the card sits in
// the middle of it.
const main = document.querySelector('main');
main.innerHTML = loginPartial;
const form = main.querySelector('u-form');
const submitButton = form.querySelector('[type="submit"]');

/** Where to go once the session exists. A gated app sends its own address along, and it is followed
 * only when it belongs to this node: the session covers the node and the apps beneath its name, and
 * anything else arrived in the query string from somewhere we have no business returning to. */
const target = () => {
	try {
		const url = new URL(new URLSearchParams(location.search).get('rd'));
		const isThisNode = (url.hostname === location.hostname || _.endsWith(url.hostname, `.${location.hostname}`));
		if (url.protocol === 'https:' && isThisNode) {
			return url.href;
		}
	} catch (error) {
		// No address, or not one at all — the node's own page is always somewhere to land.
	}

	return '/';
};

// The whole page is replaced on success rather than routed: signing in changes what this browser is
// allowed to see, and the shell decides that as it loads.
const signIn = async (event) => {
	const data = form.getData();
	submitButton.loading();
	const { isAuthenticated, message } = await sessionService.login({
		username: data.username,
		password: data.password,
		keepMeLoggedIn: Boolean(data.keepMeLoggedIn)
	});
	if (!isAuthenticated) {
		submitButton.reset();
		notifier.add({ title: message || 'Could not sign in.', type: 'error', duration: 0 });
		form.querySelector('.password').value = '';
		form.querySelector('.password').focus();
		return;
	}

	location.replace(target());
};

form.validation = [
	{
		selector: '.username',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', signIn);
const username = form.querySelector('.username');
username?.updateComplete?.then(() => { username.focus(); });
