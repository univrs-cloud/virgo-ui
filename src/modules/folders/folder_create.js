import folderModalPartial from 'modules/folders/partials/modals/folder_create.html';
import validUserPartial from 'modules/folders/partials/valid_user.html';
import * as folderService from 'modules/folders/services/folder';
import * as userService from 'modules/folders/services/user';

const validUserTemplate = _.template(validUserPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', folderModalPartial);

const modal = document.querySelector('#folder-create');
const form = modal.querySelector('u-form');

const render = () => {
	const users = userService.getUsers();
	const validUsers = form.querySelector('.valid-users');
	validUsers.innerHTML = _.isNull(users) ? '' : _.map(
		_.orderBy(users, ['username'], ['asc']),
		(user) => validUserTemplate({ user, checked: false })
	).join('');
};

const createFolder = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const validUsers = Array.from(form.querySelectorAll('.valid-users u-checkbox'))
		.filter((cb) => cb.checked)
		.map((cb) => cb.onValue);
	const config = {
		comment: data.comment,
		validUsers,
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
