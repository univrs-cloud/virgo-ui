import folderModalPartial from 'modules/folders/partials/modals/folder_update.html';
import validUserPartial from 'modules/folders/partials/valid_user.html';
import * as folderService from 'modules/folders/services/folder';
import * as userService from 'modules/folders/services/user';

const validUserTemplate = _.template(validUserPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', folderModalPartial);

const modal = document.querySelector('#folder-update');
const form = modal.querySelector('u-form');
let currentFolder = null;

const populateValidUsers = (folder) => {
	const users = userService.getUsers();
	const selectedUsers = folder?.validUsers || [];
	const validUsers = form.querySelector('.valid-users');
	validUsers.innerHTML = _.isNull(users) ? '' : _.map(
		_.orderBy(users, ['username'], ['asc']),
		(user) => validUserTemplate({ user, checked: selectedUsers.includes(user.username) })
	).join('');
};

const updateFolder = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const validUsers = Array.from(form.querySelectorAll('.valid-users u-checkbox'))
		.filter((cb) => cb.checked)
		.map((cb) => cb.onValue);
	const isNextcloudPath = currentFolder?.path?.startsWith('/messier/apps/nextcloud/');
	const config = {
		name: data.name,
		validUsers,
		...(!isNextcloudPath && { refquota: Number(data.refquota) * 1024 * 1024 * 1024 })
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
	currentFolder = _.find(folderService.getFolders(), { name });
	if (!currentFolder) {
		return;
	}

	const isNextcloudPath = currentFolder.path?.startsWith('/messier/apps/nextcloud/');
	const refquota = form.querySelector('.refquota');
	form.querySelector('.name').value = currentFolder.name;
	form.querySelector('.comment').innerHTML = currentFolder.comment;
	refquota.classList.toggle('d-none', isNextcloudPath);
	form.validation = isNextcloudPath ? [] : [refquotaValidation];
	if (!isNextcloudPath) {
		refquota.value = (currentFolder.size ? Math.round(currentFolder.size / (1024 * 1024 * 1024)) : 0);
	}
	populateValidUsers(currentFolder);
};

const restore = (event) => {
	form.reset();
};

const refquotaValidation = {
	selector: '.refquota',
	rules: {
		isEmpty: `Can't be empty`,
		isInt: { message: `Must be a number`, min: 0 }
	}
};

form.validation = [refquotaValidation];

form.addEventListener('valid', updateFolder);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
