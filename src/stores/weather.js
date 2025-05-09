import Store from 'stores/store';

class Weather extends Store {
	constructor() {
		const initialState = {
			weather: null
		};
		super({
			namespace: 'weather'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('weather', (weather) => {
			this.setState({ weather }, 'get_weather');
		});
	}
}

export default new Weather();
