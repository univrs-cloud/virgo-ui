import Store from 'stores/store';

class Runtime extends Store {
    constructor() {
		const initialState = {
			role: null
        };
        super({
			namespace: 'runtime'
		});

        this.setState(initialState, 'socket_connect');

        this.socket.on('role', (role) => {
			this.setState({ role }, 'get_role');
		});
    }

    getRole() {
		return this.getStateProperty('role');
	}
}

export default new Runtime();
