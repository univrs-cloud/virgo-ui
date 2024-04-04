import { ObservableStore } from '@codewithdan/observable-store';
import { ReduxDevToolsExtension } from '@codewithdan/observable-store-extensions';
import { io } from 'socket.io-client';

ObservableStore.globalSettings = {  
    trackStateHistory: true,
	logStateChanges: false
};
ObservableStore.addExtension(new ReduxDevToolsExtension());

class Store extends ObservableStore {
	constructor(settings) {
		super(settings);
		this.socket = io(`/${settings.namespace}`);
	}

	subscribeToProperties(properties, callback) {
		let changedProperties = [];

		let subscription = this.globalStateWithPropertyChanges.subscribe((store) => {
			if (!store) {
				return;
			}
			
			let stateChanges = store.stateChanges;
			
			if (!_.some(properties, (property) => {
				if (_.has(stateChanges, property) && !_.includes(changedProperties, property)) {
					changedProperties.push(property);
					return true;
				}

				return false;
			})) {
				return;
			}
			
			changedProperties = [];
			callback(store);
		});

		callback({ state: this.getState() });
		return subscription;
	}
}

export default Store;
