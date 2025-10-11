import * as userService from 'modules/users/services/user';

let module = document.querySelector('#users');

const lockUser = async (event) => {
	if (!event.target.closest('a')?.classList.contains('lock')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let card = button.closest('.user');
	let user = _.find(userService.getUsers(), { uid: Number(card.dataset.uid) });
	
	if (!await confirm(`Are you sure you want to lock the user ${user.username}?`)) {
		return;
	}

	let config = {
		username: user.username
	}
	userService.lockUser(config);
};

const unlockUser = async (event) => {
	if (!event.target.closest('a')?.classList.contains('unlock')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let card = button.closest('.user');
	let user = _.find(userService.getUsers(), { uid: Number(card.dataset.uid) });
	
	if (!await confirm(`Are you sure you want to unlock the user ${user.username}?`)) {
		return;
	}

	let config = {
		username: user.username
	}
	userService.unlockUser(config);
};

module.addEventListener('click', lockUser);
module.addEventListener('click', unlockUser);
