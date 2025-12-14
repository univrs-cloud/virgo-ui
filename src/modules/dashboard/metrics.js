import metricsModalPartial from 'modules/dashboard/partials/modals/metrics.html';

document.querySelector('body').insertAdjacentHTML('beforeend', metricsModalPartial);
const modal = document.querySelector('#metrics');
const modalBody = modal.querySelector('.modal-body');
const loading = modalBody.querySelector('.loading');
const container = modalBody.querySelector('.container-fluid');
console.log(modal)

const showModal = (event) => {
	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const restoreModal = (event) => {

};

modal.addEventListener('show.bs.modal', showModal);
modal.addEventListener('hidden.bs.modal', restoreModal);
