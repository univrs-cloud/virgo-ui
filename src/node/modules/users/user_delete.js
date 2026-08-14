import * as userService from 'node/modules/users/services/user';

const module = document.querySelector('#users');

const deleteUser = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.item');
	const user = _.find(userService.getUsers(), { uid: Number(row.dataset.uid) });

	if (!await confirm(`Are you sure you want to delete the user ${user.username}?`, { buttons: [{ text: 'Yes, delete', class: 'btn-danger' }] })) {
		return;
	}

	const data = {
		username: user.username
	}
	userService.deleteUser(data);
};

module.addEventListener('click', deleteUser);
