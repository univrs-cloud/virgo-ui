import 'assets/scss/index.scss';
import 'libs/lodash';
import 'libs/bootstrap';
import 'libs/dialog';
import 'libs/components';
import * as bootstrapService from 'shell/services/bootstrap';

document.addEventListener('shown.bs.modal', (event) => {
	event.target.querySelector('u-input:not([type="hidden"])')?.focus(); // focus 1st input after modal is shown
});

try {
	let encodedAccount = (document.cookie.match('(^|;)\\s*' + 'account' + '\\s*=\\s*([^;]+)')?.pop());
	let decodedAccountJson = atob(encodedAccount);
	window.account = JSON.parse(decodedAccountJson);
} catch (error) {
	window.account = {};
}
window.isAuthenticated = !_.isEmpty(account);
window.isAdmin = isAuthenticated && _.includes(account.groups, 'admins');

let subscription;

const render = async (state) => {
	const isSetupRequired = bootstrapService.checkIfSetupIsRequired(state);
	if (_.isNull(isSetupRequired) || state.update === -1) {
		return;
	}
	
	bootstrapService.unsubscribe(subscription);
	subscription = null;

	if (isSetupRequired) {
		await import('shell/setup');
	} else if (isAuthenticated && isAdmin && !_.isNull(state.update)) {
		await import('shell/update');
	} else {
		try {
			await Promise.allSettled([
				import('shell/header'),
				import('shell/main')
			]);
			const { modulesLoaded } = await import('modules');
			await modulesLoaded;
			await import('shell/navigation');
		} catch (error) {
			alert(`Error during application initialization<br><br>${error}`, );
			console.error('Error during application initialization:', error);
		}
	}
};

subscription = bootstrapService.subscribe([render]);
