import page from 'page';
import eulaPartial from 'setup/partials/eula.html';
import textPartial from 'setup/partials/eula_text.html';
import { completeStep, isStepCompleted, nextStepPath } from 'setup/wizard';

const eulaTemplate = _.template(eulaPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', eulaTemplate({ text: textPartial }));
const step = document.querySelector('#eula');
const eula = step.querySelector('.eula');
const accept = step.querySelector('[data-action="accept"]');

const unlockAccept = () => {
	if (!isStepCompleted('eula') && Math.abs(eula.scrollHeight - eula.scrollTop - eula.clientHeight) > 1) {
		return;
	}

	accept.disabled = false;
	eula.removeEventListener('scroll', unlockAccept);
};

const proceed = (event) => {
	if (accept.disabled) {
		return;
	}

	completeStep('eula');
	page(nextStepPath('eula'));
};

eula.addEventListener('scroll', unlockAccept);
accept.addEventListener('click', proceed);

// A viewport tall enough to show the whole agreement never fires a scroll event, so re-check on
// every entry to the step — the measurement is only meaningful once the step is visible.
step.onRoute = unlockAccept;
