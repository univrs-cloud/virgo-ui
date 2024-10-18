import modulePartial from 'modules/time_machines/partials/index.html';
import emptyPartial from 'modules/time_machines/partials/empty.html';
import timeMachinePartial from 'modules/time_machines/partials/time_machine.html';
import * as timeMachineService from 'modules/time_machines/services/time_machine';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const timeMachineTemplate = _.template(timeMachinePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#time-machines');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const performAction = (event) => {
	event.preventDefault();
	let button = event.currentTarget;
	let card = button.closest('.card');
	if (button.classList.contains('text-danger') && !confirm(`Are you sure you want to ${button.dataset.action} ${card.dataset.title}?`)) {
		return;
	}

	let config = {
		id: card.dataset.id,
		action: button.dataset.action
	};
	// timeMachineService.performAction(config);
};

const render = (state) => {
	if (_.isNull(state.timeMachines)) {
		return;
	}
	
	let template = document.createElement('template');
	if (_.isEmpty(state.timeMachines)) {
		template.innerHTML = emptyTemplate();
	} else {
		_.each(state.timeMachines, (timeMachine) => {
			template.innerHTML += timeMachineTemplate({ timeMachine });
		});
	}
	loading.classList.add('d-none');
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
	_.each(module.querySelectorAll('.dropdown-menu a:not(.disabled)'), (button) => {
		button.addEventListener('click', performAction);
	});
};

render({ timeMachines: timeMachineService.getTimeMachines() });

timeMachineService.subscribe([render]);
