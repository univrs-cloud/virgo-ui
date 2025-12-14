import Store from 'stores/store';

class Metrics extends Store {
	constructor() {
		const initialState = {
			metrics: null
		};
		super({
			namespace: 'metrics'
		});
		
		this.setState(initialState, 'socket_connect');
		
		this.socket.on('metrics', (metrics) => {
			this.setState({ metrics }, 'set_metrics');
		});
	}
	
	fetch() {
		this.socket.emit('metrics:fetch');
	}

	enable() {
		this.socket.emit('metrics:enable');
	}

	disable() {
		this.socket.emit('metrics:disable');
	}
}

export default new Metrics();
