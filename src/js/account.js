import accountPartial from '../partials/account.html';

let header = document.querySelector('header');
let container = document.querySelector('#account');
let auth = _.find(proxies, { forwardPort: 9091 });
let authDomain = _.first(auth?.domainNames);

const logout = (event) => {
	if (!event.target.classList.contains('sign-out') || !authDomain) {
		return;
	}
	
	event.preventDefault();
	axios.post(`https://${authDomain}/api/logout`, null, { withCredentials: true })
		.then(() => {

		})
		.catch((error) => {

		})
		.then(() => {
			location.reload();
		});
};

morphdom(container, _.template(accountPartial)({ account }));

header.addEventListener('click', logout);
