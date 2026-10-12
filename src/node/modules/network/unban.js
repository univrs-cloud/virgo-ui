import * as networkService from 'node/modules/network/services/network';

const module = document.querySelector('#network');

const unbanAddress = async (event) => {
	if (event.target.closest('button')?.dataset.action !== 'unban') {
		return;
	}

	event.preventDefault();
	const row = event.target.closest('.item');
	const jail = row.dataset.jail;
	const address = row.dataset.address;

	if (!await confirm(`Are you sure you want to unblock ${address}?`, { buttons: [{ text: 'Yes, unblock', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	const data = {
		jail,
		address
	};
	networkService.unbanAddress(data);
};

module.addEventListener('click', unbanAddress);
