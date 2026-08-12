import page from 'page';
import welcomePartial from 'setup/partials/welcome.html';
import eulaPartial from 'setup/partials/eula.html';
import { completeStep, isStepCompleted } from 'setup/wizard';

const welcomeTemplate = _.template(welcomePartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', welcomeTemplate({ eula: eulaPartial }));
const step = document.querySelector('#welcome');
const eula = step.querySelector('.eula');
const accept = step.querySelector('[data-action="accept"]');

const unlockAccept = () => {
	if (!isStepCompleted('welcome') && Math.abs(eula.scrollHeight - eula.scrollTop - eula.clientHeight) > 1) {
		return;
	}

	accept.disabled = false;
	eula.removeEventListener('scroll', unlockAccept);
};

const proceed = (event) => {
	if (accept.disabled) {
		return;
	}

	completeStep('welcome');
	page('/network/host');
};

eula.addEventListener('scroll', unlockAccept);
accept.addEventListener('click', proceed);

// A viewport tall enough to show the whole agreement never fires a scroll event, so re-check on
// every entry to the step — the measurement is only meaningful once the step is visible.
step.onRoute = unlockAccept;
