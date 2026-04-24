import * as folderService from 'modules/folders/services/folder';

const module = document.querySelector('#folders');

const deleteFolder = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}
	
	event.preventDefault();
	const button = event.target.closest('a');
	const row = button.closest('.item');
	const folder = _.find(folderService.getFolders(), { name: row.dataset.id });
	const warning = (folder?.isCustom ? 'The folder will be removed but the data at the custom path will NOT be deleted.' : 'This action cannot be undone and will permanently delete all associated data.');
	const action = folder?.isCustom ? 'remove' : 'delete';
	if (!await confirm(`Are you sure you want to ${action} the folder ${row.dataset.id}?<br><br>${warning}`, { buttons: [{ text: `Yes, ${action}`, class: 'btn-danger' }] })) {
		return;
	}

	let config = {
		name: row.dataset.id
	};
	folderService.deleteFolder(config);	
};

module.addEventListener('click', deleteFolder);
