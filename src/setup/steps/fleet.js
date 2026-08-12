import page from 'page';
import fleetPartial from 'setup/partials/fleet.html';
import statusPartial from 'setup/partials/fleet_status.html';
import * as fleetService from 'setup/services/fleet';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let isPrefilled = false;
let isSubmitting = false;
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
const reRegister = registered.querySelector('.re-register');
const fleetLink = step.querySelector('.fleet-link span');
const skip = step.querySelector('.skip');
const submit = form.querySelector('[type="submit"]');

// Registration state and connection health both come off the same configuration, so this runs on
// every delivery — a node that reconnects (or drops) while the step is open says so straight away.
const renderStatus = () => {
	const registeredNode = fleetService.isRegistered(configuration);
	const needsRegistration = (!registeredNode || isRegistering);
	form.classList.toggle('d-none', !needsRegistration);
	registered.classList.toggle('d-none', needsRegistration);
	fleetLink.textContent = (registeredNode ? 'View fleet' : 'Create account');
	submit.textContent = (registeredNode ? 'Register again' : 'Register');
	if (needsRegistration) {
		return;
	}

	morphdom(
		status,
		`<dl>${statusTemplate({ fleet: configuration?.fleet })}</dl>`,
		{ childrenOnly: true }
	);
	reRegister.classList.toggle('d-none', !configuration?.fleet?.authFailed);
};

const goNext = () => {
	completeStep('fleet');
	page(nextStepPath('fleet'));
};

const finish = () => {
	isSubmitting = false;
	clearTimeout(settleTimeout);
	settleTimeout = null;
	submit.reset();
	_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = false; });
};

const settle = (job) => {
	if (!isSubmitting || job.name !== fleetService.REGISTER_JOB || !_.includes(['completed', 'failed'], job.progress?.state)) {
		return;
	}

	finish();
	if (job.progress.state === 'failed') {
		// Unreachable fleet and rejected credentials both land here, told apart by the job's reason.
		alert(job.failedReason || 'Fleet registration failed.');
		return;
	}

	isRegistering = false;
	goNext();
};

// A node that already holds a token is tied to that account, so the email is seeded once and can
// only be confirmed from then on.
const render = (state) => {
	configuration = state.configuration;
	_.each(state.jobs, settle);
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
	if (isSubmitting) {
		return;
	}

	isSubmitting = true;
	_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.disabled = true; });
	submit.loading();
	settleTimeout = setTimeout(() => {
		finish();
		alert('Fleet registration timed out. Check that this node can reach the internet, or skip this step.');
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
	if (isSubmitting) {
		return;
	}

	goNext();
};

const goBack = (event) => {
	if (isSubmitting) {
		return;
	}

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
skip.addEventListener('click', skipStep);
reRegister.addEventListener('click', showRegistrationForm);
registered.querySelector('[data-action="continue"]').addEventListener('click', goNext);
_.each(step.querySelectorAll('[data-action="back"]'), (button) => { button.addEventListener('click', goBack); });

// The subscription keeps this step current while it is hidden; arriving here only has to drop a
// re-registration the user started and walked away from.
step.onRoute = () => {
	isRegistering = false;
	renderStatus();
};

fleetService.subscribe([render]);
