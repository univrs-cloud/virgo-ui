import backupDiskModalPartial from 'node/modules/time_capsule/partials/modals/backup_disk_create.html';
import * as backupDiskService from 'node/modules/time_capsule/services/backup_disk';
import * as userService from 'node/modules/time_capsule/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', backupDiskModalPartial);

const modal = document.querySelector('#backup-disk-create');
const form = modal.querySelector('u-form');

const render = () => {
	const users = userService.getUsers();
	const options = [
		{ value: '', label: 'Select user', default: true }
	];
	if (!_.isNull(users)) {
		_.each(_.orderBy(users, ['username'], ['asc']), (user) => {
			const base = user.fullname || user.username;
			options.push({
				value: user.username,
				label: user.isDisabled ? `${base} (locked)` : base
			});
		});
	}
	form.querySelector('.valid-users').options = options;
};

const createBackupDisk = (event) => {
	_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const config = {
		comment: data.comment,
		validUsers: data.validUsers ? [data.validUsers] : [],
		refquota: Number(data.refquota) * 1024 * 1024 * 1024
	};
	backupDiskService.createBackupDisk(config);
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

form.validation = [
	{
		selector: '.comment',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					const backupDisks = backupDiskService.getBackupDisks() || [];
					const normalizedValue = value?.toString().trim().toLowerCase();
					return !_.some(backupDisks, (backupDisk) => {
						return backupDisk.comment && backupDisk.comment.toString().trim().toLowerCase() === normalizedValue;
					});
				},
				message: `Must be unique`
			}
		}
	},
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

form.addEventListener('valid', createBackupDisk);
modal.addEventListener('show.bs.dialog', render);
modal.addEventListener('hidden.bs.dialog', restore);
