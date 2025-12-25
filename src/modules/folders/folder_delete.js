import * as folderService from 'modules/folders/services/folder';

const module = document.querySelector('#folders');

const deleteFolder = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}
	
	event.preventDefault();
	const button = event.target.closest('a');
	const row = button.closest('.folder');
	if (!await confirm(`Are you sure you want to delete the folder ${row.dataset.id}?`, { buttons: [{ text: 'Delete', class: 'btn-danger' }] })) {
		return;
	}

	// let config = {
	// 	id: row.dataset.id
	// };
	// folderService.deleteFolder(config);	
};

module.addEventListener('click', deleteFolder);
