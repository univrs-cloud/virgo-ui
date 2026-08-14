import * as userService from 'node/modules/users/services/user';

const module = document.querySelector('#users');

const lockUser = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'lock') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.item');
	const user = _.find(userService.getUsers(), { uid: Number(row.dataset.uid) });
	
	if (!await confirm(`Are you sure you want to lock the user ${user.username}?`, { buttons: [{ text: 'Lock', class: 'btn-danger' }] })) {
		return;
	}

	const data = {
		username: user.username
	}
	userService.lockUser(data);
};

const unlockUser = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'unlock') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.item');
	const user = _.find(userService.getUsers(), { uid: Number(row.dataset.uid) });
	
	if (!await confirm(`Are you sure you want to unlock the user ${user.username}?`, { buttons: [{ text: 'Unlock' }] })) {
		return;
	}

	const data = {
		username: user.username
	}
	userService.unlockUser(data);
};

module.addEventListener('click', lockUser);
module.addEventListener('click', unlockUser);
