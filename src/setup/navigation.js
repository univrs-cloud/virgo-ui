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
import { STEPS, completeStepsBefore } from 'setup/wizard';

const container = document.querySelector('main');

const showStep = (ctx) => {
	_.each(container.querySelectorAll('.wizard > div'), (element) => { element.classList.add('d-none'); });

	const step = container.querySelector(`#${ctx.step}`);
	step?.classList.remove('d-none');
	step?.onRoute?.(ctx);
};

_.each(STEPS, ({ name, path }) => {
	page(path, (ctx) => {
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
