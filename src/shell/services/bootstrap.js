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
	if (
		!networkInterface?.dhcp &&
		!_.isEmpty(state.drives) &&
		_.size(_.filter(state.storage, (storage) => { return storage?.type?.toLowerCase() === 'pool'; })) > 0 &&
		_.size(_.filter(state.containers, (container) => {
			// Match by exact container name (backward compatibility) or pattern {project_name}-{service_name}-{number}
			return _.includes(['authelia', 'traefik'], container.name) || _.some(container.names, (name) => { return name.startsWith('/authelia-authelia-') || name.startsWith('/traefik-traefik-'); });
		})) === 2
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
