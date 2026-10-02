import Store from 'stores/store';

class Indexer extends Store {
	constructor() {
		super({
			namespace: 'indexer',
		});
	}

	search(query) {
		return this.socket.timeout(30000).emitWithAck('indexer:search', query);
	}
}

export default new Indexer();
