import * as userService from 'modules/users/services/user';

const module = document.querySelector('#users');

const lockUser = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'lock') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.user');
	const user = _.find(userService.getUsers(), { uid: Number(row.dataset.uid) });
	
	if (!await confirm(`Are you sure you want to lock the user ${user.username}?`, { buttons: [{ text: 'Lock', class: 'btn-danger' }] })) {
		return;
	}

	let config = {
		username: user.username
	}
	userService.lockUser(config);
};

const unlockUser = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'unlock') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.user');
	const user = _.find(userService.getUsers(), { uid: Number(row.dataset.uid) });
	
	if (!await confirm(`Are you sure you want to unlock the user ${user.username}?`, { buttons: [{ text: 'Unlock' }] })) {
		return;
	}

	let config = {
		username: user.username
	}
	userService.unlockUser(config);
};

module.addEventListener('click', lockUser);
module.addEventListener('click', unlockUser);
