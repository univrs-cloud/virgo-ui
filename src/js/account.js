import accountPartial from '../partials/account.html';
import * as proxyService from './services/proxy';

const accountTemplate = _.template(accountPartial);
let state;
let authDomain = null;

const logout = (event) => {
	if (!event.target.classList.contains('sign-out') || !authDomain) {
		return;
	}
	
	event.preventDefault();
	axios.post(`https://${authDomain}/api/logout`, null, { withCredentials: true })
		.then(() => { })
		.catch((error) => { })
		.then(() => {
			location.reload();
		});
};

const render = (data) => {
	state = { ...state, ...data };
	if (_.isNull(state.proxies) || _.isUndefined(state.upgrade)) {
		return;
	}

	let upgrade = state.upgrade;
	let auth = _.find(state.proxies, { forwardPort: 9091 });
	authDomain = _.first(auth?.domainNames);
	morphdom(
		document.querySelector('#account'),
		accountTemplate({ account, authDomain, upgrade })
	);
};

document.body.addEventListener('click', logout);

proxyService.subscribe([render]);

export {
	render
};
