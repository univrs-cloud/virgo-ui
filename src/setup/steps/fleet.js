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
let settleTimeout = null;
// The node's own connect attempt times out after 10s, plus the job round trip.
const SETTLE_TIMEOUT = 60000;
const fleetTemplate = _.template(fleetPartial);
const statusTemplate = _.template(statusPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', fleetTemplate());
const step = document.querySelector('#fleet');
const form = step.querySelector('u-form');
const registered = step.querySelector('.registered');
const status = registered.querySelector('.status');
const reRegisterLink = registered.querySelector('.re-register');
const fleetLink = step.querySelector('.fleet-link span');
const skipLink = step.querySelector('.skip');
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
	completeStep('fleet');
	page(nextStepPath('fleet'));
};

const idle = () => {
	clearTimeout(settleTimeout);
	settleTimeout = null;
	submitButton.reset();
	skipLink.classList.remove('disabled', 'pe-none');
	_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = false; });
};

// The job is what the form follows: while one is running the form is locked, and the step advances
// when it finishes — but only if it is the step on screen, since a job outlives the page that
// started it. A failure leaves the user here; the job toaster carries the reason.
const renderJob = (jobs) => {
	const job = _.find(jobs, { name: fleetService.REGISTER_JOB });
	const isSettled = _.includes(['completed', 'failed'], job?.progress?.state);
	if (job && !isSettled) {
		clearTimeout(settleTimeout);
		skipLink.classList.add('disabled', 'pe-none');
		_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = true; });
		submitButton.loading();
		return;
	}

	// Only a job that has reported back concludes the step. An empty list is the gap between asking
	// for one and the node queueing it, and unlocking there would hand the form back mid-flight.
	if (!isSettled || !submitButton.disabled) {
		return;
	}

	idle();
	if (job.progress.state === 'completed' && !step.classList.contains('d-none')) {
		isRegistering = false;
		goNext();
	}
};

// A node that already holds a token is tied to that account, so the email is seeded once and can
// only be confirmed from then on.
const render = (state) => {
	configuration = state.configuration;
	renderJob(state.jobs);
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
	skipLink.classList.add('disabled', 'pe-none');
	_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = true; });
	submitButton.loading();
	// The job locks the form once it appears; until it does, this covers a request that never lands.
	settleTimeout = setTimeout(() => {
		idle();
		notifier.add({ title: 'Fleet registration timed out. Check that this node can reach the internet, or skip this step.', type: 'error', duration: 0 });
	}, SETTLE_TIMEOUT);
	fleetService.updateFleet(form.getData());
};

const showRegistrationForm = (event) => {
	event.preventDefault();
	isRegistering = true;
	renderStatus();
	form.querySelector('.password').focus();
};

const skipStep = (event) => {
	event.preventDefault();
	goNext();
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
skipLink.addEventListener('click', skipStep);
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
