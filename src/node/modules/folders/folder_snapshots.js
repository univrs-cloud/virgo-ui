import * as folderService from 'node/modules/folders/services/folder';

const module = document.querySelector('#folders');

const updateSnapshots = async (event) => {
	const button = event.target.closest('a');
	if (button?.dataset.action !== 'snapshots') {
		return;
	}

	event.preventDefault();
	const row = button.closest('.item');
	const folder = _.find(folderService.getFolders(), { name: row.dataset.id });
	const mode = button.dataset.mode;
	if (
		mode === 'disabled' &&
		!await confirm(`Are you sure you want to disable snapshots for the folder ${folder.comment}?<br><br>All existing snapshots of this folder will be <strong>permanently deleted</strong> and no new ones will be taken. Without snapshots, files that are deleted, overwritten or encrypted by mistake can no longer be recovered.<br><br>To stop taking new snapshots while keeping the existing ones, pause them instead.`, { buttons: [{ text: 'Yes, disable', class: 'btn-solid theme-danger' }] })
	) {
		return;
	}

	const data = {
		name: folder.name,
		mode
	};
	folderService.updateFolderSnapshots(data);
};

module.addEventListener('click', updateSnapshots);
