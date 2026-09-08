const ESSENTIAL_NAMESPACES = {
	host: ['update', 'reboot', 'shutdown'],
	node: null,
	runtime: null
};

const registeredStores = [];
let active = false;

const registerStore = (store) => {
	registeredStores.push(store);
	if (active && !isEssentialNamespace(store.namespace)) {
		store.socket.disconnect();
	}
};

const isEssentialNamespace = (namespace) => {
	return Object.prototype.hasOwnProperty.call(ESSENTIAL_NAMESPACES, namespace);
};

const isEssential = (namespace, propertyNames) => {
	if (!isEssentialNamespace(namespace)) {
		return false;
	}

	const essentialProperties = ESSENTIAL_NAMESPACES[namespace];
	if (_.isNull(essentialProperties)) {
		return true;
	}

	return _.some(propertyNames, (propertyName) => _.includes(essentialProperties, propertyName));
};

const blocksStateWrite = (namespace, propertyNames) => {
	if (!active) {
		return false;
	}

	return !isEssential(namespace, propertyNames);
};

const isActive = () => {
	return active;
};

const enter = () => {
	if (active) {
		return;
	}

	active = true;
	_.each(registeredStores, (store) => {
		if (isEssentialNamespace(store.namespace)) {
			return;
		}

		store.socket.disconnect();
	});
	document.dispatchEvent(new CustomEvent('update-mode'));
};

export {
	registerStore,
	blocksStateWrite,
	isActive,
	enter
};
