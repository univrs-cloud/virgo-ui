import Store from 'stores/store';

class Indexer extends Store {
	constructor() {
		const initialState = {
			indexerDatasets: null,
			indexerStats: null
		};
		super({
			namespace: 'indexer',
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			this.setState({ indexerStats: null, indexerDatasets: null }, 'socket_disconnect');
		});

		this.socket.on('indexer:datasets', (indexerDatasets) => {
			this.setState({ indexerDatasets }, 'get_indexer_datasets');
		});

		this.socket.on('indexer:stats', (indexerStats) => {
			this.setState({ indexerStats }, 'get_indexer_stats');
		});
	}

	getDatasets() {
		return this.getStateProperty('indexerDatasets');
	}

	updateDatasets(config) {
		this.socket.emit('indexer:dataset:config:update', config);
	}
}

export default new Indexer();
