import * as userService from 'modules/users/services/user';

const module = document.querySelector('#users');

const deleteUser = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const card = button.closest('.user');
	const user = _.find(userService.getUsers(), { uid: Number(card.dataset.uid) });

	if (!await confirm(`Are you sure you want to delete the user ${user.username}?`, { buttons: [{ text: 'Delete', class: 'btn-danger' }] })) {
		return;
	}

	let config = {
		username: user.username
	}
	userService.deleteUser(config);
};

module.addEventListener('click', deleteUser);
