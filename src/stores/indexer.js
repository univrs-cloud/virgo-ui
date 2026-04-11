import Store from 'stores/store';

class Indexer extends Store {
	constructor() {
		const initialState = {
			indexerStats: null,
		};
		super({
			namespace: 'indexer',
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			this.setState({ stats: null }, 'socket_disconnect');
		});

		this.socket.on('indexer:stats', (indexerStats) => {
			this.setState({ indexerStats }, 'get_indexer_stats');
		});
	}
}

export default new Indexer();
