import * as nodeService from 'shell/services/node';

const module = document.querySelector('#sites');

const deleteSite = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	event.preventDefault();
	const row = event.target.closest('.item');
	const nodeId = row?.dataset.nodeId;
	if (!nodeId) {
		return;
	}
	const name = row.querySelector('.site-name')?.textContent?.trim() || nodeId;

	if (!await confirm(`Are you sure you want to delete the site ${name}? Everyone with access to it will lose access.`, { buttons: [{ text: 'Yes, delete', class: 'btn-danger' }] })) {
		return;
	}

	try {
		await nodeService.deleteNode({ nodeId });
	} catch (error) {
		alert(error.message);
	}
};

module.addEventListener('click', deleteSite);
