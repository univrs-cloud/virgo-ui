import groupModalPartial from 'node/modules/apps/partials/modals/nextcloud_group_create.html';
import accountModalPartial from 'node/modules/apps/partials/modals/nextcloud_account_create.html';
import deleteModalPartial from 'node/modules/apps/partials/modals/nextcloud_account_delete.html';
import updateModalPartial from 'node/modules/apps/partials/modals/nextcloud_account_update.html';
import * as appService from 'node/modules/apps/services/app';

const APP_NAME = 'nextcloud';
const USER_ID_PATTERN = /^[a-z0-9_.@-]{1,64}$/i;
const GIB = 1024 * 1024 * 1024;

document.querySelector('body').insertAdjacentHTML('beforeend', groupModalPartial + accountModalPartial + deleteModalPartial + updateModalPartial);

const module = document.querySelector('#apps');
const groupModal = document.querySelector('#nextcloud-group-create');
const groupForm = groupModal.querySelector('u-form');

const accountModal = document.querySelector('#nextcloud-account-create');
const accountForm = accountModal.querySelector('u-form');
let defaultQuota = null;

const renderAccountForm = () => {
	const accounts = appService.getNextcloudAccounts();
	defaultQuota = (accounts?.defaultLimit > 0 ? String(Math.round(accounts.defaultLimit / GIB)) : null);
	accountForm.querySelector('.groups').options = _.map(accounts?.groups, (group) => { return { value: group.id, label: group.displayName }; });
	accountForm.querySelector('.quota').value = (defaultQuota ?? '');
};

const addAccount = () => {
	const data = accountForm.getData();
	const quota = _.trim(data.quota);
	_.each(accountForm.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	appService.manageNextcloudAccounts('user:add', {
		name: APP_NAME,
		user: _.trim(data.user),
		displayName: _.trim(data.displayName),
		email: _.trim(data.email),
		password: data.password,
		groups: accountForm.querySelector('.groups').value,
		quota: (quota === '' || quota === defaultQuota ? 'default' : Number(quota))
	});
	bootstrap.Dialog.getInstance(accountModal)?.hide();
};

const updateModal = document.querySelector('#nextcloud-account-update');
const updateForm = updateModal.querySelector('u-form');
let updatedUser = null;
let updateDefaultQuota = null;

const renderUpdateForm = (event) => {
	const accounts = appService.getNextcloudAccounts();
	updatedUser = _.find(accounts?.users, { id: event.relatedTarget?.dataset.user }) ?? null;
	updateDefaultQuota = (accounts?.defaultLimit > 0 ? String(Math.round(accounts.defaultLimit / GIB)) : null);
	const ownQuota = (updatedUser && !updatedUser.isDefaultLimit && _.isNumber(updatedUser.limit) ? String(Math.round(updatedUser.limit / GIB)) : null);
	updateForm.querySelector('.title-user').textContent = (updatedUser?.id ?? '');
	updateForm.querySelector('.display-name').value = (updatedUser?.displayName ?? '');
	updateForm.querySelector('.email').value = (updatedUser?.email ?? '');
	updateForm.querySelector('.quota').value = (ownQuota ?? (updatedUser?.isDefaultLimit ? (updateDefaultQuota ?? '') : ''));
};

const updateAccount = () => {
	if (!updatedUser) {
		return;
	}

	const data = updateForm.getData();
	const quota = _.trim(data.quota);
	const keepsDefault = (updatedUser.isDefaultLimit && (quota === '' || quota === updateDefaultQuota));
	_.each(updateForm.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	appService.manageNextcloudAccounts('user:edit', {
		name: APP_NAME,
		user: updatedUser.id,
		displayName: _.trim(data.displayName),
		email: _.trim(data.email),
		quota: (keepsDefault ? 'default' : Number(quota))
	});
	bootstrap.Dialog.getInstance(updateModal)?.hide();
};

const deleteModal = document.querySelector('#nextcloud-account-delete');
const deleteForm = deleteModal.querySelector('u-form');
const deleteButton = deleteForm.querySelector('.delete');
const acknowledge = deleteForm.querySelector('.acknowledge');
let deletedUser = null;

const renderDeleteForm = (event) => {
	const users = appService.getNextcloudAccounts()?.users;
	deletedUser = _.find(users, { id: event.relatedTarget?.dataset.user }) ?? null;
	deleteForm.querySelector('.title-user').textContent = (deletedUser ? `${deletedUser.displayName} (${deletedUser.id})` : '');
	deleteForm.querySelector('.transfer-to').options = [
		{ value: '', label: 'Do not transfer', default: true },
		..._.map(_.reject(users, { id: deletedUser?.id }), (user) => { return { value: user.id, label: `${user.displayName} (${user.id})` }; })
	];
	deleteButton.disabled = true;
};

const deleteAccount = () => {
	if (!deletedUser || !acknowledge.checked) {
		return;
	}

	const transferTo = deleteForm.getData().transferTo;
	_.each(deleteForm.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	appService.manageNextcloudAccounts('user:delete', { name: APP_NAME, user: deletedUser.id, ...(transferTo ? { transferTo } : {}) });
	bootstrap.Dialog.getInstance(deleteModal)?.hide();
};

const groupExists = (name) => {
	const normalizedName = _.toLower(_.trim(name));
	return _.some(appService.getNextcloudAccounts()?.groups, (group) => { return _.toLower(group.id) === normalizedName || _.toLower(group.displayName) === normalizedName; });
};

const addGroup = () => {
	_.each(groupForm.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	appService.manageNextcloudAccounts('group:add', { name: APP_NAME, group: _.trim(groupForm.getData().group) });
	bootstrap.Dialog.getInstance(groupModal)?.hide();
};

const setUserEnabled = async (event) => {
	const trigger = event.target.closest('[data-nextcloud-user-action]');
	if (!trigger) {
		return;
	}

	event.preventDefault();
	const user = _.find(appService.getNextcloudAccounts()?.users, { id: trigger.dataset.user });
	if (!user) {
		return;
	}

	const action = trigger.dataset.nextcloudUserAction;
	if (action === 'disable' && !await confirm(`Are you sure you want to disable ${_.escape(user.displayName)}?<br><br>They can no longer log in or sync until the account is enabled again. Their files are kept.`, { buttons: [{ text: 'Disable', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	appService.manageNextcloudAccounts(`user:${action}`, { name: APP_NAME, user: user.id });
};

const deleteGroup = async (event) => {
	const trigger = event.target.closest('[data-nextcloud-group-delete]');
	if (!trigger) {
		return;
	}

	event.preventDefault();
	const group = _.find(appService.getNextcloudAccounts()?.groups, { id: trigger.dataset.nextcloudGroupDelete });
	if (!group) {
		return;
	}

	if (!await confirm(`Are you sure you want to delete the group ${_.escape(group.displayName)}?<br><br>Its members keep their accounts and files, but anything shared with the group is no longer shared with them.`, { buttons: [{ text: 'Delete', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	appService.manageNextcloudAccounts('group:delete', { name: APP_NAME, group: group.id });
};

groupForm.validation = [
	{
		selector: '.group',
		rules: {
			isEmpty: `Can't be empty`,
			isLength: { message: `At most 64 characters`, max: 64 },
			custom: {
				validate: (value) => { return !groupExists(value); },
				message: `Already exists`
			}
		}
	}
];
accountForm.validation = [
	{
		selector: '.user',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					if (!USER_ID_PATTERN.test(_.trim(value))) {
						return `Use letters, digits, dots, dashes, underscores or @`;
					}
					return (_.some(appService.getNextcloudAccounts()?.users, (user) => { return _.toLower(user.id) === _.toLower(_.trim(value)); }) ? `Already exists` : true);
				}
			}
		}
	},
	{
		selector: '.display-name',
		rules: {
			isEmpty: `Can't be empty`,
			isLength: { message: `At most 64 characters`, max: 64 }
		}
	},
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: `Invalid email address`
		}
	},
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`,
			isStrongPassword: {
				message: `At least 8 characters`,
				minLength: 8,
				minLowercase: 0,
				minUppercase: 0,
				minNumbers: 0,
				minSymbols: 0
			}
		}
	},
	{
		selector: '.password-check',
		rules: {
			isEmpty: `Can't be empty`,
			equals: {
				message: `Passwords do not match`,
				comparison: () => { return accountForm.querySelector('.password').value; }
			}
		}
	},
	{
		selector: '.quota',
		rules: {
			custom: {
				validate: (value) => {
					if (_.trim(value) === '') {
						return (_.isNull(defaultQuota) ? true : `Can't be empty`);
					}
					if (!/^\d+$/.test(_.trim(value))) {
						return `Must be a whole number`;
					}
					return (Number(value) >= 1 ? true : `At least 1`);
				}
			}
		}
	}
];
accountForm.addEventListener('valid', addAccount);
accountModal.addEventListener('show.bs.dialog', renderAccountForm);
accountModal.addEventListener('hidden.bs.dialog', () => { accountForm.reset(); });
updateForm.validation = [
	{
		selector: '.display-name',
		rules: {
			isEmpty: `Can't be empty`,
			isLength: { message: `At most 64 characters`, max: 64 }
		}
	},
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: `Invalid email address`
		}
	},
	{
		selector: '.quota',
		rules: {
			custom: {
				validate: (value) => {
					if (_.trim(value) === '') {
						return (updatedUser?.isDefaultLimit && _.isNull(updateDefaultQuota) ? true : `Can't be empty`);
					}
					if (!/^\d+$/.test(_.trim(value))) {
						return `Must be a whole number`;
					}
					return (Number(value) >= 1 ? true : `At least 1`);
				}
			}
		}
	}
];
updateForm.addEventListener('valid', updateAccount);
updateModal.addEventListener('show.bs.dialog', renderUpdateForm);
updateModal.addEventListener('hidden.bs.dialog', () => {
	updatedUser = null;
	updateForm.reset();
});
acknowledge.addEventListener('checked-changed', () => { deleteButton.disabled = !acknowledge.checked; });
deleteForm.addEventListener('valid', deleteAccount);
deleteModal.addEventListener('show.bs.dialog', renderDeleteForm);
deleteModal.addEventListener('hidden.bs.dialog', () => {
	deletedUser = null;
	deleteForm.reset();
	deleteButton.disabled = true;
});
groupForm.addEventListener('valid', addGroup);
groupModal.addEventListener('hidden.bs.dialog', () => { groupForm.reset(); });
module.addEventListener('click', deleteGroup);
module.addEventListener('click', setUserEnabled);
