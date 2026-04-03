import folderModalPartial from 'modules/folders/partials/modals/folder_update.html';
import * as folderService from 'modules/folders/services/folder';
import * as userService from 'modules/folders/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', folderModalPartial);

const modal = document.querySelector('#folder-update');
const form = modal.querySelector('u-form');

const populateValidUsers = (folder) => {
	const users = userService.getUsers();
	const selectedUser = folder?.validUsers?.length ? _.first(folder.validUsers) : '';
	const options = [
		{ value: '', label: 'Guest', default: !selectedUser }
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

const updateFolder = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const config = {
		name: data.name,
		validUsers: data.validUsers ? [data.validUsers] : [],
		refquota: Number(data.refquota) * 1024 * 1024 * 1024
	};
	folderService.updateFolder(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const row = event.relatedTarget?.closest('.item');
	if (!row) {
		return;
	}

	const name = row.dataset.id;
	const folder = _.find(folderService.getFolders(), { name });
	if (!folder) {
		return;
	}

	form.querySelector('.name').value = folder.name;
	form.querySelector('.comment').innerHTML = folder.comment;
	form.querySelector('.refquota').value = (folder.size ? Math.round(folder.size / (1024 * 1024 * 1024)) : 0);
	populateValidUsers(folder);
};

const restore = (event) => {
	form.reset();
};

form.validation = [
	{
		selector: '.refquota',
		rules: {
			isEmpty: `Can't be empty`,
			isInt: { message: `Must be a number`, min: 0 }
		}
	}
];

form.addEventListener('valid', updateFolder);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
