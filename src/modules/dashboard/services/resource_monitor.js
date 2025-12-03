import Host from 'stores/host';

let callbackCollection = [];

const handleSubscription = (properties) => {
	if (properties.memory) {
		properties.memory.unreclaimable = {};
		properties.memory.unreclaimable.value = properties.memory.total - properties.memory.available;
		properties.memory.unreclaimable.percent = (properties.memory.unreclaimable.value / properties.memory.total) * 100;
		properties.memory.reclaimable = {};
		properties.memory.reclaimable.value = properties.memory.available - properties.memory.free;
		properties.memory.reclaimable.percent = (properties.memory.reclaimable.value / properties.memory.total) * 100;
		properties.memory.capacity = {};
		properties.memory.capacity.value = properties.memory.reclaimable.value + properties.memory.unreclaimable.value;
		properties.memory.capacity.percent = properties.memory.reclaimable.percent + properties.memory.unreclaimable.percent;
	}
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	return Host.subscribeToProperties(['system', 'cpuStats', 'memory', 'networkStats', 'storage', 'drives', 'ups', 'time'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe
};
