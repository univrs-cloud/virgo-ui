import backupDiskModalPartial from 'node/modules/time_capsule/partials/modals/backup_disk_update.html';
import * as backupDiskService from 'node/modules/time_capsule/services/backup_disk';
import * as userService from 'node/modules/time_capsule/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', backupDiskModalPartial);

const modal = document.querySelector('#backup-disk-update');
const form = modal.querySelector('u-form');

const populateValidUsers = (backupDisk) => {
	const users = userService.getUsers();
	const selectedUser = backupDisk?.validUsers?.length ? _.first(backupDisk.validUsers) : '';
	const options = [
		{ value: '', label: 'Select user', default: !selectedUser }
	];
	if (!_.isNull(users)) {
		_.each(_.orderBy(users, ['username'], ['asc']), (user) => {
			const base = user.fullname || user.username;
			options.push({
				value: user.username,
				label: user.isDisabled ? `${base} (locked)` : base,
				default: selectedUser === user.username
			});
		});
	}
	const validUsersSelect = form.querySelector('.valid-users');
	validUsersSelect.options = options;
	validUsersSelect.value = selectedUser;
};

const updateBackupDisk = (event) => {
	_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const config = {
		name: data.name,
		validUsers: data.validUsers ? [data.validUsers] : [],
		refquota: Number(data.refquota) * 1024 * 1024 * 1024
	};
	backupDiskService.updateBackupDisk(config);
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const render = (event) => {
	const row = event.relatedTarget?.closest('.item');
	if (!row) {
		return;
	}

	const name = row.dataset.id;
	const backupDisk = _.find(backupDiskService.getBackupDisks(), { name });
	if (!backupDisk) {
		return;
	}

	form.querySelector('.name').value = backupDisk.name;
	form.querySelector('.comment').textContent = backupDisk.comment;
	form.querySelector('.refquota').value = (backupDisk.size ? Math.round(backupDisk.size / (1024 * 1024 * 1024)) : 0);
	populateValidUsers(backupDisk);
};

const restore = (event) => {
	form.reset();
};

form.validation = [
	{
		selector: '.valid-users',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.refquota',
		rules: {
			isEmpty: `Can't be empty`,
			isInt: { message: `Must be a number`, min: 0 }
		}
	}
];

form.addEventListener('valid', updateBackupDisk);
modal.addEventListener('show.bs.dialog', render);
modal.addEventListener('hidden.bs.dialog', restore);
