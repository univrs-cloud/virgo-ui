import timeMachineModalPartial from 'modules/time_machines/partials/modals/time_machine_update.html';
import * as timeMachineService from 'modules/time_machines/services/time_machine';
import * as userService from 'modules/time_machines/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', timeMachineModalPartial);

const modal = document.querySelector('#time-machine-update');
const form = modal.querySelector('u-form');

const populateValidUsers = (timeMachine) => {
	const users = userService.getUsers();
	const selectedUser = timeMachine?.validUsers?.length ? _.first(timeMachine.validUsers) : '';
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

const updateTimeMachine = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const config = {
		name: data.name,
		validUsers: data.validUsers ? [data.validUsers] : [],
		refquota: Number(data.refquota) * 1024 * 1024 * 1024
	};
	timeMachineService.updateTimeMachine(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const row = event.relatedTarget?.closest('.time-machine');
	if (!row) {
		return;
	}

	const name = row.dataset.id;
	const timeMachine = _.find(timeMachineService.getTimeMachines(), { name });
	if (!timeMachine) {
		return;
	}

	form.querySelector('.name').value = timeMachine.name;
	form.querySelector('.comment').innerHTML = timeMachine.comment;
	form.querySelector('.refquota').value = (timeMachine.size ? Math.round(timeMachine.size / (1024 * 1024 * 1024)) : 0);
	populateValidUsers(timeMachine);
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

form.addEventListener('valid', updateTimeMachine);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
