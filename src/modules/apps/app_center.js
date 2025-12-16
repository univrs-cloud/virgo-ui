import appCenterModalPartial from 'modules/apps/partials/modals/app_center.html';
import itemPartial from 'modules/apps/partials/modals/app_center_item.html';
import * as appCenterService from 'modules/apps/services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', appCenterModalPartial);

let subscription;
const itemTemplate = _.template(itemPartial);
const modal = document.querySelector('#app-center');
const modalBody = modal.querySelector('.modal-body');
const loading = modalBody.querySelector('.loading');
const container = modalBody.querySelector('.tab-content');
const rowExplore = container.querySelector('#app-center-explore .row');
const rowInstalled = container.querySelector('#app-center-installed .row');

const openInstallModal = (event) => {
	if (!event.target.classList.contains('install')) {
		return;
	}

	event.preventDefault();
	const modal = bootstrap.Modal.getOrCreateInstance(event.target.dataset.bsTarget);
	modal.show(event.target);
};

const render = (state) => {
	if (_.isNull(state.templates)) {
		return;
	}

	const templateInstallable = document.createElement('template');
	const installable = _.filter(state.templates, { isInstalled: false });
	templateInstallable.innerHTML = _.join(_.map(installable, (app) => {
		const jobs = _.filter(state.jobs, (job) => { return job.name === 'app:install' && job.data.config.id === app.id && job.progress?.state === 'active'; });
		return itemTemplate({ app, jobs });
	}), '');
	
	const templateInstalled = document.createElement('template');
	const installed = _.filter(state.templates, { isInstalled: true });
	templateInstalled.innerHTML = _.join(_.map(installed, (app) => {
		return itemTemplate({ app, jobs: [] });
	}), '');

	modal.querySelector('.count-explore').innerHTML = _.size(installable);
	modal.querySelector('.count-installed').innerHTML = _.size(installed);

	morphdom(
		rowExplore,
		`<div>${templateInstallable.innerHTML}</div>`,
		{ childrenOnly: true }
	);
	morphdom(
		rowInstalled,
		`<div>${templateInstalled.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

modal.addEventListener('click', openInstallModal);
modal.addEventListener('show.bs.modal', () => {
	subscription = appCenterService.subscribe([render])
});
modal.addEventListener('hide.bs.modal', () => {
	appCenterService.unsubscribe(subscription);
	subscription = null;
});
modal.addEventListener('hidden.bs.modal', () => {
	rowExplore.innerHTML = '';
	rowInstalled.innerHTML = '';
	container.classList.add('d-none');
	loading.classList.remove('d-none');
});
