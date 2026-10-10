import * as sessionService from 'node/services/session';

let wasAuthenticated = false;

const render = (state) => {
	const isSessionActive = !_.isNil(state.role);
	if (wasAuthenticated && !isSessionActive) {
		location.reload();
		return;
	}

	wasAuthenticated = isSessionActive;
};

sessionService.subscribe([render]);
