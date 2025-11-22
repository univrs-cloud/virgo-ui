import modulePartial from 'modules/time_machines/partials/index.html';
import emptyPartial from 'modules/time_machines/partials/empty.html';
import timeMachinePartial from 'modules/time_machines/partials/time_machine.html';
import * as timeMachineService from 'modules/time_machines/services/time_machine';
import copy from 'copy-to-clipboard';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const timeMachineTemplate = _.template(timeMachinePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#time-machines');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const copyToClipboard = (event) => {
	if (event.target.closest('a').dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const text = button.nextElementSibling.innerHTML;
	if (copy(text)) {
		const tooltip = bootstrap.Tooltip.getInstance(button);
		const originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const performAction = async (event) => {
	event.preventDefault();
	const button = event.currentTarget;
	const timeMachine = button.closest('.time-machines');
	if (button.classList.contains('text-danger') && !await confirm(`Are you sure you want to ${button.dataset.action} ${timeMachine.dataset.title}?`)) {
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
	
	const template = document.createElement('template');
	if (_.isEmpty(state.timeMachines)) {
		template.innerHTML = emptyTemplate();
	} else {
		const networkInterface = state.networkInterface;
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
