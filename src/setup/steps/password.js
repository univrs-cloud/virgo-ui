import page from 'page';
import passwordPartial from 'setup/partials/password.html';
import * as userService from 'setup/services/user';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let isSubmitting = false;
let settleTimeout = null;
// Linux, samba and authelia are written in sequence, so the job outlives a quick round trip.
const SETTLE_TIMEOUT = 60000;
const passwordTemplate = _.template(passwordPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', passwordTemplate());
const step = document.querySelector('#password');
const form = step.querySelector('u-form');
const username = step.querySelector('.username');
const back = step.querySelector('[data-action="back"]');
const submit = step.querySelector('[type="submit"]');

const goNext = () => {
	completeStep('password');
	page(nextStepPath('password'));
};

const finish = () => {
	isSubmitting = false;
	clearTimeout(settleTimeout);
	settleTimeout = null;
	submit.reset();
	back.disabled = false;
};

const settle = (job) => {
	if (!isSubmitting || !_.includes(['completed', 'failed'], job.progress?.state)) {
		return;
	}

	finish();
	if (job.progress.state === 'failed') {
		// A missing authelia users file lands here: the linux and samba passwords are already changed
		// by then, so the reason matters more than a generic message.
		alert(job.failedReason || 'The password could not be changed.');
		return;
	}

	form.reset();
	goNext();
};

const render = ({ users, jobs }) => {
	_.each(jobs, settle);
	if (isSubmitting) {
		return;
	}

	username.textContent = (userService.findDefaultUser(users)?.username || '—');
};

const changePassword = (event) => {
	if (isSubmitting) {
		return;
	}

	const user = userService.getDefaultUser();
	if (_.isUndefined(user)) {
		alert('The default account has not been reported by this node yet.');
		return;
	}

	isSubmitting = true;
	back.disabled = true;
	submit.loading();
	settleTimeout = setTimeout(() => {
		finish();
		alert('The password change timed out.');
	}, SETTLE_TIMEOUT);
	userService.changePassword({ ...form.getData(), username: user.username });
};

const goBack = (event) => {
	if (isSubmitting) {
		return;
	}

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
back.addEventListener('click', goBack);

userService.subscribe([render]);
