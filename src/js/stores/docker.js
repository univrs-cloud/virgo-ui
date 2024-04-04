import Store from "./store";

class Docker extends Store {
	constructor() {
		const initialState = {
			configured: null,
			templates: null
		};
		super({
			namespace: 'docker'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});

		this.socket.on('configured', (configured) => {
			this.setState({ configured }, 'set_configured');
		});

		this.socket.on('templates', (templates) => {
			this.setState({ templates }, 'set_templates');
		});
	}
}

export default new Docker();
