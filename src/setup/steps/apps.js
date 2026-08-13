import page from 'page';
import jobProgressPartial from 'setup/partials/job_progress.html';
import appsPartial from 'setup/partials/apps.html';
import statePartial from 'setup/partials/apps_state.html';
import * as appsService from 'setup/services/apps';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const appsTemplate = _.template(appsPartial);
const stateTemplate = _.template(statePartial);
const jobProgressTemplate = _.template(jobProgressPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', appsTemplate());
const step = document.querySelector('#apps');
const core = step.querySelector('.core');
const backButton = step.querySelector('[data-action="back"]');
const continueButton = step.querySelector('[data-action="continue"]');

const goNext = (event) => {
	completeStep('apps');
	page(nextStepPath('apps'));
};

const goBack = (event) => {
	page(previousStepPath('apps'));
};

// The node installs these on its own once the pool is ready, so this step only reports what it is
// doing — and holds the wizard here until both are in place, since the password written by the next
// step goes into a file Authelia has to have created.
const render = ({ configured, jobs }) => {
	morphdom(
		core,
		`<dl>${stateTemplate({ apps: appsService.getCoreApps(configured, jobs), jobProgressTemplate })}</dl>`,
		{ childrenOnly: true }
	);
	continueButton.disabled = !appsService.isInstalled(configured);
};

continueButton.addEventListener('click', goNext);
backButton.addEventListener('click', goBack);

appsService.subscribe([render]);
