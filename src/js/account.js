import accountPartial from '../partials/account.html';
import * as proxyService from './services/proxy';

const accountTemplate = _.template(accountPartial);
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
		document.querySelector('#account'),
		accountTemplate({ account, authDomain })
	);
};

const init = () => {
	render({ proxies: proxyService.getProxies() });

	proxyService.subscribe([render]);

	document.body.addEventListener('click', logout);
};

export {
	init
};
