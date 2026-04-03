import folderModalPartial from 'modules/folders/partials/modals/folder_create.html';
import * as folderService from 'modules/folders/services/folder';
import * as userService from 'modules/folders/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', folderModalPartial);

const modal = document.querySelector('#folder-create');
const form = modal.querySelector('u-form');

const render = () => {
	const users = userService.getUsers();
	const options = [
		{ value: '', label: 'Guest', default: true }
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

const createFolder = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const config = {
		comment: data.comment,
		validUsers: data.validUsers ? [data.validUsers] : [],
		refquota: Number(data.refquota) * 1024 * 1024 * 1024
	};
	folderService.createFolder(config);
	bootstrap.Modal.getInstance(modal)?.hide();
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
					const folders = folderService.getFolders() || [];
					const normalizedValue = value?.toString().trim().toLowerCase();
					return !_.some(folders, (folder) => {
						return folder.comment && folder.comment.toString().trim().toLowerCase() === normalizedValue;
					});
				},
				message: `Must be unique`
			}
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

form.addEventListener('valid', createFolder);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
