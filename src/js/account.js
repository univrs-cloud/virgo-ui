import accountPartial from '../partials/account.html';

let header = document.querySelector('header');
let account = document.querySelector('#account');

const logout = (event) => {
	if (!event.target.classList.contains('sign-out')) {
		return;
	}
	
	event.preventDefault();
	axios.post('https://auth.origin.univrs.cloud/api/logout', null, { withCredentials: true })
		.then(() => {

		})
		.catch((error) => {

		})
		.then(() => {
			location.reload();
		});
};

morphdom(account, _.template(accountPartial)());

header.addEventListener('click', logout);
