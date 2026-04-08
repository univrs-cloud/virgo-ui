import * as networkService from 'modules/network/services/network';

const module = document.querySelector('#network');

const deleteTrustedProxy = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.item');
	const address = row.dataset.id;

	if (!await confirm(`Are you sure you want to delete the trusted proxy ${address}?`, { buttons: [{ text: 'Yes, delete', class: 'btn-danger' }] })) {
		return;
	}

	let config = {
		address
	};
	networkService.deleteTrustedProxy(config);
};

module.addEventListener('click', deleteTrustedProxy);
