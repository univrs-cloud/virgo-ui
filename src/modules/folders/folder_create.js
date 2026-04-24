import folderModalPartial from 'modules/folders/partials/modals/folder_create.html';
import validUserPartial from 'modules/folders/partials/valid_user.html';
import * as folderService from 'modules/folders/services/folder';
import * as userService from 'modules/folders/services/user';

const validUserTemplate = _.template(validUserPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', folderModalPartial);

const modal = document.querySelector('#folder-create');
const form = modal.querySelector('u-form');
const loading = modal.querySelector('.loading');
const content = modal.querySelector('.content');
const pathSelect = form.querySelector('.path');
const refquota = form.querySelector('.refquota');

const render = async () => {
	const customPaths = await folderService.getCustomPaths();
	const existingPaths = _.map(folderService.getFolders(), 'path');
	const availablePaths = _.filter(customPaths, (path) => { return !existingPaths.includes(path); });

	const options = [{ value: '', label: 'New share', default: true }];
	if (!_.isEmpty(availablePaths)) {
		options.push({
			label: 'Existing paths',
			options: _.map(availablePaths, (path) => { return { value: path, label: path }; })
		});
	}
	pathSelect.options = options;
	refquota.classList.remove('d-none');

	const users = userService.getUsers();
	const validUsers = form.querySelector('.valid-users');
	validUsers.innerHTML = _.isNull(users) ? '' : _.map(
		_.orderBy(users, ['username'], ['asc']),
		(user) => validUserTemplate({ user, checked: false })
	).join('');
	loading.classList.add('d-none');
	content.classList.remove('d-none');
};

const createFolder = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const validUsers = Array.from(form.querySelectorAll('.valid-users u-checkbox'))
		.filter((cb) => cb.checked)
		.map((cb) => cb.onValue);
	const isNewShare = !data.path;
	const config = {
		comment: data.comment,
		path: data.path,
		validUsers,
		...(isNewShare && { refquota: Number(data.refquota) * 1024 * 1024 * 1024 })
	};
	folderService.createFolder(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = () => {
	form.reset();
	loading.classList.remove('d-none');
	content.classList.add('d-none');
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
			custom: {
				validate: (value, input, form) => {
					if (form.querySelector('.path').value) {
						return true;
					}

					if (form.validator.isEmpty(value.toString().trim())) {
						return `Can't be empty`;
					}

					if (!form.validator.isInt(value.toString(), { min: 0 })) {
						return `Must be a number`;
					}

					return true;
				}
			}
		}
	}
];

pathSelect.addEventListener('value-changed', () => {
	refquota.classList.toggle('d-none', !!pathSelect.value);
});

form.addEventListener('valid', createFolder);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
