import fleetModalPartial from 'modules/settings/partials/modals/fleet.html';
import Job from 'stores/job';
import * as configurationService from 'modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', fleetModalPartial);

const modal = document.querySelector('#fleet');
const form = modal.querySelector('u-form');
const credentialsSection = form.querySelector('.fleet-credentials');
const credentialsHint = form.querySelector('.fleet-credentials-hint');
const statusEl = form.querySelector('.fleet-status');
let pendingRegistration = false;

const modalInstance = () => bootstrap.Modal.getInstance(modal);

const setFormBusy = (busy) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = busy; });
};

const clearStatus = () => {
	statusEl.classList.add('d-none');
	statusEl.classList.remove('alert-danger', 'alert-info');
	statusEl.textContent = '';
};

const showStatus = (message, { error = false } = {}) => {
	statusEl.textContent = message;
	statusEl.classList.remove('d-none', 'alert-danger', 'alert-info');
	statusEl.classList.add(error ? 'alert-danger' : 'alert-info');
};

const updateCredentialsVisibility = (fleet) => {
	const needsCredentials = form.querySelector('.enabled').checked && !fleet?.registered;
	credentialsSection.classList.toggle('d-none', !needsCredentials);
	credentialsHint.classList.toggle('d-none', !needsCredentials);
};

const updateFleet = () => {
	const fleet = configurationService.getConfiguration()?.fleet || {};
	const config = form.getData();
	config.enabled = Boolean(form.querySelector('.enabled').checked);
	pendingRegistration = config.enabled && !fleet.registered;

	if (!config.enabled || fleet.registered) {
		delete config.password;
	}

	clearStatus();
	setFormBusy(true);
	configurationService.updateFleet(config);

	if (!pendingRegistration) {
		modalInstance()?.hide();
	}
};

const restore = () => {
	pendingRegistration = false;
	clearStatus();
	setFormBusy(false);
	form.reset();
	credentialsSection.classList.remove('d-none');
	credentialsHint.classList.add('d-none');
};

const render = () => {
	const fleet = configurationService.getConfiguration()?.fleet || {};
	form.querySelector('.enabled').checked = Boolean(fleet.enabled);
	form.querySelector('.email').value = fleet.email || '';
	form.querySelector('.password').value = '';
	updateCredentialsVisibility(fleet);
};

const handleFleetJob = (jobs = []) => {
	const fleetJob = _.find(jobs, (job) => job.name === 'fleet:update');
	if (!fleetJob) {
		return;
	}

	if (fleetJob.progress?.state === 'active') {
		showStatus(fleetJob.progress.message || 'Registering with fleet...');
		setFormBusy(true);
		return;
	}

	if (fleetJob.progress?.state === 'failed') {
		pendingRegistration = false;
		setFormBusy(false);
		showStatus(fleetJob.failedReason || 'Registration failed.', { error: true });
		return;
	}

	if (fleetJob.progress?.state === 'completed') {
		const wasPending = pendingRegistration;
		pendingRegistration = false;
		setFormBusy(false);
		clearStatus();
		if (wasPending || configurationService.getConfiguration()?.fleet?.registered) {
			modalInstance()?.hide();
		}
	}
};

Job.subscribeToProperties(['jobs'], ({ jobs }) => {
	handleFleetJob(jobs);

	if (!pendingRegistration) {
		return;
	}

	const fleetJob = _.find(jobs, (job) => job.name === 'fleet:update');
	if (fleetJob) {
		return;
	}

	if (configurationService.getConfiguration()?.fleet?.registered) {
		pendingRegistration = false;
		setFormBusy(false);
		clearStatus();
		modalInstance()?.hide();
		return;
	}

	pendingRegistration = false;
	setFormBusy(false);
	showStatus('Registration failed.', { error: true });
});

form.validation = [
	{
		selector: '.email',
		rules: {
			custom: {
				message: 'Invalid email address',
				validate: (value, input, form) => {
					const fleet = configurationService.getConfiguration()?.fleet || {};
					const enabled = form.querySelector('.enabled').checked;
					if (!enabled || fleet.registered) {
						return true;
					}
					return form.validator.isEmail(value);
				}
			}
		}
	},
	{
		selector: '.password',
		rules: {
			custom: {
				message: `Can't be empty`,
				validate: (value, input, form) => {
					const fleet = configurationService.getConfiguration()?.fleet || {};
					const enabled = form.querySelector('.enabled').checked;
					if (!enabled || fleet.registered) {
						return true;
					}
					return !form.validator.isEmpty(value);
				}
			}
		}
	}
];

form.querySelector('.enabled').addEventListener('change', () => {
	updateCredentialsVisibility(configurationService.getConfiguration()?.fleet || {});
});
form.addEventListener('valid', updateFleet);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
