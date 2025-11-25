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
			path: '/api',
			reconnection: true,
			reconnectionAttempts: 30,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		});
		this.propertySubscribers = [];
		this.previousState = this.getState() || {};

		this.globalStateWithPropertyChanges.subscribe((stateChange) => {
			if (stateChange === null) {
				return;
			}

			const newState = stateChange.state || {};
			const stateChanges = stateChange.stateChanges || [];
			this.propertySubscribers.forEach((subscriber) => {
				const hasChanged = subscriber.properties.some((propertyName) => {
					return Object.prototype.hasOwnProperty.call(stateChanges, propertyName);
				});
				if (hasChanged) {
					const currentProperties = {};
					subscriber.properties.forEach((propertyName) => {
						currentProperties[propertyName] = newState[propertyName];
					});
					subscriber.callback(currentProperties);
				}
			});
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
