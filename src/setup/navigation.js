import page from 'page';
// Steps render themselves into `main .wizard` on import, so this module must load after `setup/main`.
import 'setup/jobs';
import 'setup/steps/welcome';
import 'setup/steps/host';
import 'setup/steps/interface';
import 'setup/steps/ports';
import 'setup/steps/storage';
import 'setup/steps/fleet';
import 'setup/steps/apps';
import 'setup/steps/password';
import 'setup/steps/finish';
import * as appsService from 'setup/services/apps';
import * as fleetService from 'setup/services/fleet';
import * as networkService from 'setup/services/network';
import * as storageService from 'setup/services/storage';
import { STEPS, completeStepsBefore, stepPath } from 'setup/wizard';

const container = document.querySelector('main');
const loading = container.querySelector('.loading');
const wizard = container.querySelector('.wizard');
let isStarted = false;
const bootSubscriptions = [];

const showStep = (ctx) => {
	_.each(container.querySelectorAll('.wizard > div'), (element) => { element.classList.add('d-none'); });

	const step = container.querySelector(`#${ctx.step}`);
	step?.classList.remove('d-none');
	step?.onRoute?.(ctx);
};

// What each step leaves behind is what the ones after it are built on, however the wizard is entered:
// by clicking forward, by refreshing, or by typing the address. A leased address would move under the
// node, so nothing past the interface step runs until it is static. Everything past storage is kept on
// the pool — the password reaches Authelia's file, registration writes to the database — so those
// steps stay out of reach until there is one. Registration is not optional either, so nothing past
// the fleet step runs until the node holds a token. Past the apps step the same holds for the apps
// themselves: listed in the registry is not enough, they have to be running.
const isAfter = (name, step) => {
	return _.findIndex(STEPS, { name }) > _.findIndex(STEPS, { name: step });
};

// The node reports its address as dynamic for as long as it holds a lease. An interface it has not
// described yet counts as static: the guard turns people away on an answer, never on the absence of one.
const hasStaticAddress = () => {
	return _.find(networkService.getDefaultInterface()?.addrInfo, { family: 'inet' })?.dynamic !== true;
};

// The pool everything after the storage step is written to.
const hasStoragePool = () => {
	return !_.isUndefined(storageService.getPool());
};

const hasFleetRegistration = () => {
	return fleetService.isRegistered();
};

// Both apps the node cannot be signed in to without, up rather than merely listed.
const hasCoreAppsRunning = () => {
	return _.every(appsService.getCoreApps(), 'isRunning');
};

_.each(STEPS, ({ name, path }) => {
	page(path, (ctx) => {
		if (isAfter(name, 'interface') && !hasStaticAddress()) {
			page.redirect(stepPath('interface'));
			return;
		}

		if (isAfter(name, 'storage') && !hasStoragePool()) {
			page.redirect(stepPath('storage'));
			return;
		}

		if (isAfter(name, 'fleet') && !hasFleetRegistration()) {
			page.redirect(stepPath('fleet'));
			return;
		}

		if (isAfter(name, 'apps') && !hasCoreAppsRunning()) {
			page.redirect(stepPath('apps'));
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

/** Every guard above turns someone away on what the node reports, and page.js decides the route once,
 * on load. A guard reading a property that has not arrived cannot tell "there is no pool" from "no
 * answer yet", so a refresh deep in the wizard would bounce back to a step that is already done. The
 * wizard therefore stays behind the loading screen until each of them has an answer — a failed load
 * included, since the node reports that as `false` and it is as much an answer as any other. */
const isReported = () => {
	return !_.isNil(networkService.getSystem())
		&& !_.isNil(storageService.getStorage())
		&& !_.isNil(fleetService.getConfiguration());
};

const start = () => {
	if (isStarted) {
		return;
	}

	isStarted = true;
	_.each(bootSubscriptions, (unsubscribe) => { unsubscribe(); });
	loading.remove();
	container.removeAttribute('class');
	wizard.classList.remove('d-none');
	page.start();
};

const startWhenReported = () => {
	if (isReported()) {
		start();
	}
};

_.each([networkService, storageService, fleetService], (service) => {
	bootSubscriptions.push(service.subscribe([startWhenReported]));
});
