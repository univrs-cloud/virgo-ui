import timeMachineModalPartial from 'modules/time_machines/partials/modals/time_machine_create.html';
import * as timeMachineService from 'modules/time_machines/services/time_machine';
import * as userService from 'modules/time_machines/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', timeMachineModalPartial);

const modal = document.querySelector('#time-machine-create');
const form = modal.closest('u-form');

const populateValidUsers = () => {
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

const createTimeMachine = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	const config = {
		comment: data.comment,
		validUsers: data.validUsers ? [data.validUsers] : [],
		refquota: Number(data.refquota) * 1024 * 1024 * 1024
	};
	timeMachineService.createTimeMachine(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

form.validation = [
	{
		selector: '.comment',
		rules: {
			isEmpty: `Can't be empty`
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

form.addEventListener('valid', createTimeMachine);
modal.addEventListener('show.bs.modal', populateValidUsers);
modal.addEventListener('hidden.bs.modal', restore);
