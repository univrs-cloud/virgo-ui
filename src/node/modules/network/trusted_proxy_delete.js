import * as networkService from 'node/modules/network/services/network';

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

	const data = {
		address
	};
	networkService.deleteTrustedProxy(data);
};

module.addEventListener('click', deleteTrustedProxy);
