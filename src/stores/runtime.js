import Store from 'stores/store';

const isStartingError = (error) => {
	try {
		return (error?.description === 503 && _.toLower(JSON.parse(error.context?.responseText)?.message) === 'starting');
	} catch (parseError) {
		return false;
	}
};

class Runtime extends Store {
    constructor() {
		const initialState = {
			role: null,
			starting: false
        };
        super({
			namespace: 'runtime'
		});

        this.setState(initialState, 'socket_connect');

        this.socket.on('connect', () => {
			this.setState({ starting: false }, 'socket_connect');
		});

        this.socket.on('connect_error', (error) => {
			this.setState({ starting: isStartingError(error) }, 'socket_connect_error');
		});

        this.socket.on('role', (role) => {
			this.setState({ role }, 'get_role');
		});
    }

    getRole() {
		return this.getStateProperty('role');
	}
}

export default new Runtime();
