import { ObservableStore } from '@codewithdan/observable-store';
import { ReduxDevToolsExtension } from '@codewithdan/observable-store-extensions';
import { io } from 'socket.io-client';

ObservableStore.globalSettings = {
	trackStateHistory: false,
	logStateChanges: false
};
ObservableStore.addExtension(new ReduxDevToolsExtension());

class Store extends ObservableStore {
	constructor(settings) {
		super(settings);
		this.socket = io(`/${settings.namespace}`, {
			reconnection: true,
			reconnectionAttempts: 30,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		});
		this.propertySubscribers = [];
		this.previousState = this.getState() || {};

		this.stateChanged.subscribe((newState) => {
			newState = newState || {};
			this.propertySubscribers.forEach((subscriber) => {
				const propertiesChanged = subscriber.properties.some((propertyName) => {
					const prevValue = this.previousState[propertyName];
					const newValue = newState[propertyName];
					return prevValue !== newValue;
				});
			
				if (propertiesChanged) {
					const currentProperties = {};
					subscriber.properties.forEach((propertyName) => {
						currentProperties[propertyName] = newState[propertyName];
					});
					subscriber.callback(currentProperties);
				}
			});
			// Update previousState for the next comparison
			this.previousState = newState;
		});
	}

	subscribeToProperties(propertyNames, callback) {
		this.propertySubscribers.push({
			properties: propertyNames,
			callback: callback,
		});
		
		const currentState = this.getState() || {};
		const currentProperties = {};
		propertyNames.forEach((propertyName) => {
			currentProperties[propertyName] = currentState[propertyName];
		});
		callback(currentProperties);
	
		// Return the unsubscribe function
		return () => {
			this.propertySubscribers = this.propertySubscribers.filter(
				(sub) => sub.callback !== callback
			);
		};
	}
}

export default Store;
