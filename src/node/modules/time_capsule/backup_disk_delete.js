import * as backupDiskService from 'node/modules/time_capsule/services/backup_disk';

const module = document.querySelector('#time-capsule');

const deleteBackupDisk = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}
	
	event.preventDefault();
	const button = event.target.closest('a');
	const row = button.closest('.item');
	if (!await confirm(`Are you sure you want to delete the backup disk ${row.dataset.id}?<br><br>This action cannot be undone and will permanently delete all associated data.`, { buttons: [{ text: 'Yes, delete', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	const data = {
		name: row.dataset.id
	};
	backupDiskService.deleteBackupDisk(data);	
};

module.addEventListener('click', deleteBackupDisk);
