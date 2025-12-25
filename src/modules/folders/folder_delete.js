import * as folderService from 'modules/folders/services/folder';

const module = document.querySelector('#folders');

const deleteFolder = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}
	
	event.preventDefault();
	const button = event.target.closest('a');
	const folder = button.closest('.folder');
	if (!await confirm(`Are you sure you want to delete the folder ${folder.dataset.id}?`, { buttons: [{ text: 'Delete', class: 'btn-danger' }] })) {
		return;
	}

	// let config = {
	// 	id: folder.dataset.id,
	// 	action: button.dataset.action
	// };
	// folderService.performAction(config);	
};

module.addEventListener('click', deleteFolder);
