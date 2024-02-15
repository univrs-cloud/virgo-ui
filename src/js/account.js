import accountPartial from '../partials/account.html';

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

const render = () => {
	const template = _.template(accountPartial);
	morphdom(document.querySelector('#account'), template());
};

document.querySelector('header').addEventListener('click', logout);

render();
