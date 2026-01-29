import * as timeMachineService from 'modules/time_machines/services/time_machine';

const module = document.querySelector('#time-machines');

const deleteTimeMachine = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}
	
	event.preventDefault();
	const button = event.target.closest('a');
	const row = button.closest('.time-machine');
	if (!await confirm(`Are you sure you want to delete the time machine ${row.dataset.id}?`, { buttons: [{ text: 'Delete', class: 'btn-danger' }] })) {
		return;
	}

	let config = {
		id: row.dataset.id
	};
	timeMachineService.deleteTimeMachine(config);	
};

module.addEventListener('click', deleteTimeMachine);
