import accountPartial from '../partials/account.html';
import * as proxyService from './services/proxy';

const accountTemplate = _.template(accountPartial);
let header = document.querySelector('header');
let container = document.querySelector('#account');
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

const render = (state) => {
	if (_.isNull(state.proxies)) {
		return;
	}

	let auth = _.find(state.proxies, { forwardPort: 9091 });
	authDomain = _.first(auth?.domainNames);
	morphdom(
		container,
		 accountTemplate({ account, authDomain })
	);
};

header.addEventListener('click', logout);

proxyService.subscribe([render]);
