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

	updateDatasets(data) {
		this.socket.emit('indexer:dataset:config:update', data);
	}

	search(query) {
		return this.socket.timeout(30000).emitWithAck('indexer:search', query);
	}
}

export default new Indexer();
