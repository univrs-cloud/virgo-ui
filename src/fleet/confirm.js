import confirmPartial from 'fleet/partials/confirm.html';
import * as fleetAuthService from 'shell/services/fleet_auth';

// Landing screen for the email verification link (/signup/confirm?token=…). Verifies the token via
// the API (which sets the gated session cookies), then reloads so the router forces enrollment.
export const mount = (ctx) => {
	const main = document.querySelector('main');
	main.innerHTML = confirmPartial;
	const confirming = main.querySelector('.confirming');
	const failed = main.querySelector('.failed');

	const token = new URLSearchParams(ctx?.querystring ?? window.location.search).get('token');

	const fail = (message) => {
		confirming.classList.add('d-none');
		failed.querySelector('.failed-reason').textContent = message || 'This verification link is invalid or has expired.';
		failed.classList.remove('d-none');
	};

	(async () => {
		if (!token) {
			fail();
			return;
		}
		try {
			const result = await fleetAuthService.confirm({ token });
			if (result?.status !== 'succeeded') {
				fail(result?.message);
				return;
			}
			// Cookies now carry the setup_required session; reload so the router lands on /mfa/setup.
			window.location.replace('/');
		} catch (error) {
			fail(error.message);
		}
	})();
};
