import page from 'page';
import passwordPartial from 'setup/partials/password.html';
import * as userService from 'setup/services/user';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let settleTimeout = null;
// Linux, samba and authelia are written in sequence, so the job outlives a quick round trip.
const SETTLE_TIMEOUT = 60000;
const passwordTemplate = _.template(passwordPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', passwordTemplate());
const step = document.querySelector('#password');
const form = step.querySelector('u-form');
const username = step.querySelector('.username');
const backButton = step.querySelector('[data-action="back"]');
const submitButton = step.querySelector('[type="submit"]');

const goNext = () => {
	completeStep('password');
	page(nextStepPath('password'));
};

const idle = () => {
	clearTimeout(settleTimeout);
	settleTimeout = null;
	submitButton.reset();
	backButton.disabled = false;
};

// The job is what the form follows: while one is running the form is locked, and the step advances
// when it finishes — but only if it is the step on screen, since a job outlives the page that
// started it. A failure leaves the user here; the job toaster carries the reason.
const renderJob = (jobs) => {
	const job = _.find(jobs, { name: userService.PASSWORD_JOB });
	const isSettled = _.includes(['completed', 'failed'], job?.progress?.state);
	if (job && !isSettled) {
		clearTimeout(settleTimeout);
		backButton.disabled = true;
		submitButton.loading();
		return;
	}

	// A locked form is the record that this step has a job of its own to conclude.
	if (!submitButton.disabled) {
		return;
	}

	idle();
	if (job?.progress?.state === 'completed' && !step.classList.contains('d-none')) {
		form.reset();
		goNext();
	}
};

const render = ({ users, jobs }) => {
	renderJob(jobs);
	username.textContent = (userService.findDefaultUser(users)?.username || '—');
};

const changePassword = (event) => {
	const user = userService.getDefaultUser();
	if (_.isUndefined(user)) {
		notifier.add({ title: 'The default account has not been reported by this node yet.', type: 'error', duration: 0 });
		return;
	}

	backButton.disabled = true;
	submitButton.loading();
	// The job locks the form once it appears; until it does, this covers a request that never lands.
	settleTimeout = setTimeout(() => {
		idle();
		notifier.add({ title: 'The password change timed out.', type: 'error', duration: 0 });
	}, SETTLE_TIMEOUT);
	userService.changePassword({ ...form.getData(), username: user.username });
};

const goBack = (event) => {
	page(previousStepPath('password'));
};

form.validation = [
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`,
			isStrongPassword: {
				message: `At least 8 characters`,
				minLength: 8,
				minLowercase: 0,
				minUppercase: 0,
				minNumbers: 0,
				minSymbols: 0
			}
		}
	},
	{
		selector: '.password-check',
		rules: {
			isEmpty: `Can't be empty`,
			equals: {
				message: `Passwords do not match`,
				comparison: () => { return form.querySelector('.password').value; }
			}
		}
	}
];
form.addEventListener('valid', changePassword);
backButton.addEventListener('click', goBack);

userService.subscribe([render]);
