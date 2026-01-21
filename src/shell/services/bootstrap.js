import Host from 'stores/host';
import Docker from 'stores/docker'; // need to init store

let callbackCollection = [];

const reconnectSocket = () => {
	Host.socket.connect();
};

const disconnectSocket = () => {
	Host.socket.disconnect();
};

const checkIfSetupIsRequired = (state) => {
	if (_.isNull(state.system) || _.isNull(state.drives) || _.isNull(state.storage) || _.isNull(state.containers)) {
		return null;
	}
	const networkInterface = _.find(state.system.networkInterfaces, { default: true });
	
	// Check if we have both authelia and traefik containers (by direct name or pattern)
	const hasAuthelia = _.some(state.containers, (container) => {
		return container.labels?.comDockerComposeService === 'authelia';
	});
	
	const hasTraefik = _.some(state.containers, (container) => {
		return container.labels?.comDockerComposeService === 'traefik';
	});
	
	if (
		!networkInterface?.dhcp &&
		!_.isEmpty(state.drives) &&
		_.size(_.filter(state.storage, (storage) => { return storage?.type?.toLowerCase() === 'pool'; })) > 0 &&
		hasAuthelia && hasTraefik
	) {
		return false;
	}

	return true;
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	return Host.subscribeToProperties(['update', 'system', 'drives', 'storage', 'containers'], handleSubscription);
};

const unsubscribe = (subscription) => {
	if (subscription) {
		subscription();
	}
};

window.addEventListener('beforeunload', (event) => {
	disconnectSocket();
});

document.addEventListener('visibilitychange', (event) => {
	if (document.visibilityState === 'visible') {
		reconnectSocket();
	}
});

export {
	subscribe,
	unsubscribe,
	checkIfSetupIsRequired
};
