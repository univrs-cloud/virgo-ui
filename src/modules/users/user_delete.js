import * as userService from 'modules/users/services/user';

let module = document.querySelector('#users');

const deleteUser = (event) => {
	if (!event.target.closest('a')?.classList.contains('delete')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let card = button.closest('.user');
	let user = _.find(userService.getUsers(), { uid: Number(card.dataset.uid) });

	if (!confirm(`Are you sure you want to delete the user ${user.username}?`)) {
		return;
	}

	let config = {
		username: user.username
	}
	userService.deleteUser(config);
};

module.addEventListener('click', deleteUser);
