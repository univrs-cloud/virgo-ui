import modulePartial from 'modules/time_machines/partials/index.html';
import emptyPartial from 'modules/time_machines/partials/empty.html';
import timeMachinePartial from 'modules/time_machines/partials/time_machine.html';
import * as timeMachineService from 'modules/time_machines/services/time_machine';
import copy from 'copy-to-clipboard';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const timeMachineTemplate = _.template(timeMachinePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#time-machines');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const copyToClipboard = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	let button = event.target.closest('a');
	let text = button.nextElementSibling.innerHTML;
	if (copy(text)) {
		let tooltip = bootstrap.Tooltip.getInstance(button);
		let originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const performAction = (event) => {
	event.preventDefault();
	let button = event.currentTarget;
	let timeMachine = button.closest('.time-machines');
	if (button.classList.contains('text-danger') && !confirm(`Are you sure you want to ${button.dataset.action} ${timeMachine.dataset.title}?`)) {
		return;
	}

	let config = {
		id: timeMachine.dataset.id,
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
		let networkInterface = state.networkInterface;
		_.each(state.timeMachines, (timeMachine) => {
			template.innerHTML += timeMachineTemplate({ timeMachine, networkInterface, bytes });
		});
	}
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');

	_.each(module.querySelectorAll('.dropdown-menu a:not(.disabled)'), (button) => {
		button.addEventListener('click', performAction);
	});
};

module.addEventListener('click', copyToClipboard);

timeMachineService.subscribe([render]);
