import page from 'page';
// Steps render themselves into `main .wizard` on import, so this module must load after `setup/main`.
import 'setup/jobs';
import 'setup/steps/welcome';
import 'setup/steps/host';
import 'setup/steps/interface';
import 'setup/steps/ports';
import 'setup/steps/storage';
import 'setup/steps/password';
import 'setup/steps/fleet';
import 'setup/steps/finish';
import * as storageService from 'setup/services/storage';
import { STEPS, completeStepsBefore, stepPath } from 'setup/wizard';

const container = document.querySelector('main');

const showStep = (ctx) => {
	_.each(container.querySelectorAll('.wizard > div'), (element) => { element.classList.add('d-none'); });

	const step = container.querySelector(`#${ctx.step}`);
	step?.classList.remove('d-none');
	step?.onRoute?.(ctx);
};

// Everything past storage is kept on the pool — the password reaches Authelia's file, registration
// writes to the database — so those steps stay out of reach until there is one, however the wizard
// is entered: by clicking forward, by refreshing, or by typing the address.
const needsPool = (name) => {
	return _.findIndex(STEPS, { name }) > _.findIndex(STEPS, { name: 'storage' });
};

_.each(STEPS, ({ name, path }) => {
	page(path, (ctx) => {
		if (needsPool(name) && !storageService.hasPool()) {
			page.redirect(stepPath('storage'));
			return;
		}

		ctx.step = name;
		completeStepsBefore(name);
		showStep(ctx);
	});
});

// Catch all route, must be last
page('*', (ctx) => {
	page.redirect('/');
});
page.start();
