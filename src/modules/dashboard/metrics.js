import metricsModalPartial from 'modules/dashboard/partials/modals/metrics.html';
import disabledPartial from 'modules/dashboard/partials/modals/metrics/disabled.html';
import graphsPartial from 'modules/dashboard/partials/modals/metrics/graphs.html';
import * as metricsService from 'modules/dashboard/services/metrics';

document.querySelector('body').insertAdjacentHTML('beforeend', metricsModalPartial);
const modal = document.querySelector('#metrics');
const modalBody = modal.querySelector('.modal-body');
const loading = modalBody.querySelector('.loading');
const container = modalBody.querySelector('.container-fluid');
let subsciption;

const enable = (event) => {
	if (!event.target.classList.contains('enable')) {
		return;
	}

	event.target.loading();
	metricsService.enable();
};

const disable = (event) => {
	if (!event.target.classList.contains('disable')) {
		return;
	}

	event.target.loading();
	metricsService.disable();
};

const render = (state) => {
	if (_.isNull(state.metrics)) {
		return;
	}
	
	loading.classList.add('d-none');
	
	const metrics = state.metrics;
	if (!metrics.isEnabled) {
		container.innerHTML = disabledPartial;
		container.classList.remove('d-none');
		return;
	}

	container.innerHTML = graphsPartial;
	container.classList.remove('d-none');
};

const showModal = (event) => {
	subsciption = metricsService.subscribe([render]);
};

const restoreModal = (event) => {
	container.innerHTML = '';
	container.classList.add('d-none');
	loading.classList.remove('d-none');
	metricsService.unsubscribe(subsciption);
};

modal.addEventListener('show.bs.modal', showModal);
modal.addEventListener('hidden.bs.modal', restoreModal);
modal.addEventListener('click', enable);
modal.addEventListener('click', disable);
