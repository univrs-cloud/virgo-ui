import page from 'page';
import fleetPartial from 'setup/partials/fleet.html';
import statusPartial from 'setup/partials/fleet_status.html';
import * as fleetService from 'setup/services/fleet';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let isPrefilled = false;
let isRegistering = false;
// The last configuration the node reported, so entering the step can re-render without reading the
// store behind the subscription's back.
let configuration = null;
const fleetTemplate = _.template(fleetPartial);
const statusTemplate = _.template(statusPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', fleetTemplate());
const step = document.querySelector('#fleet');
const form = step.querySelector('u-form');
const registered = step.querySelector('.registered');
const status = registered.querySelector('.status');
const reRegisterLink = registered.querySelector('.re-register');
const fleetLink = step.querySelector('.fleet-link span');
const submitButton = form.querySelector('[type="submit"]');

// Registration state and connection health both come off the same configuration, so this runs on
// every delivery — a node that reconnects (or drops) while the step is open says so straight away.
const renderStatus = () => {
	const registeredNode = fleetService.isRegistered(configuration);
	const needsRegistration = (!registeredNode || isRegistering);
	form.classList.toggle('d-none', !needsRegistration);
	registered.classList.toggle('d-none', needsRegistration);
	fleetLink.textContent = (registeredNode ? 'View fleet' : 'Create account');
	submitButton.textContent = (registeredNode ? 'Register again' : 'Register');
	if (needsRegistration) {
		return;
	}

	morphdom(
		status,
		`<dl>${statusTemplate({ fleet: configuration?.fleet })}</dl>`,
		{ childrenOnly: true }
	);
	reRegisterLink.classList.toggle('d-none', !configuration?.fleet?.authFailed);
};

const goNext = () => {
	fleetService.installCoreApps();
	completeStep('fleet');
	page(nextStepPath('fleet'));
};

const idle = () => {
	submitButton.reset();
	_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = false; });
};

// The job is what the form follows: while one is running the form is locked, and the step advances on
// a completed job that left the node holding a token — but only if it is the step on screen, since a
// job outlives the page that started it. Only a job that has reported back concludes the step: an
// empty list is the gap between asking for one and the node queueing it, and unlocking there would
// hand the form back mid-flight. Anything short of a registered node leaves the user here to try again;
// the job toaster carries the reason. A node that already holds a token is tied to that account, so the
// email is seeded once and can only be confirmed from then on.
const render = (state) => {
	configuration = state.configuration;
	const job = _.find(state.jobs, { name: fleetService.REGISTER_JOB });
	const isSettled = _.includes(['completed', 'failed'], job?.progress?.state);
	if (job && !isSettled) {
		_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = true; });
		submitButton.loading();
	} else if (isSettled && submitButton.disabled) {
		idle();
		if (job.progress.state === 'completed' && fleetService.isRegistered(configuration) && !step.classList.contains('d-none')) {
			isRegistering = false;
			goNext();
		}
	}

	renderStatus();
	if (isPrefilled || _.isNull(configuration) || _.isUndefined(configuration)) {
		return;
	}

	const email = configuration?.fleet?.email || '';
	form.querySelector('.email').value = email;
	form.querySelector('.email').readonly = !_.isEmpty(email);
	isPrefilled = true;
};

const registerFleet = (event) => {
	// Leaving mid-registration would hand the next step a node whose enrolment is still in flight.
	_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = true; });
	submitButton.loading();
	const data = form.getData();
	fleetService.updateFleet(data);
};

const showRegistrationForm = (event) => {
	event.preventDefault();
	isRegistering = true;
	renderStatus();
	form.querySelector('.password').focus();
};

const goBack = (event) => {
	page(previousStepPath('fleet'));
};

form.validation = [
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: `Invalid email address`
		}
	},
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', registerFleet);
reRegisterLink.addEventListener('click', showRegistrationForm);
registered.querySelector('[data-action="continue"]').addEventListener('click', goNext);
_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.addEventListener('click', goBack); });

// The subscription keeps this step current while it is hidden; arriving here only has to drop a
// re-registration the user started and walked away from.
step.onRoute = () => {
	isRegistering = false;
	renderStatus();
};

fleetService.subscribe([render]);
