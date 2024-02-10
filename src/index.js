import './index.scss';
import weatherCondition from './js/openmeteo-condition-map';

bootstrap.Tooltip.Default.container = 'body';
bootstrap.Tooltip.Default.html = true;
bootstrap.Tooltip.Default.sanitize = false;
_.each(document.querySelectorAll('[data-bs-toggle="tooltip"]'), (element) => {
	new bootstrap.Tooltip(element);
});

let latitude = '45.749';
let longitude = '21.227';
let timezeone = 'Europe/Bucharest';
fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset&current_weather=true&temperature_unit=celsius&timezone=${timezeone}`)
	.then((response) => {
		return response.json();
	})
	.then((data) => {
		let timeOfDay = (data.current_weather.time > data.daily.sunrise[0] && data.current_weather.time < data.daily.sunset[0] ? 'day' : 'night');
		let weather = weatherCondition(data.current_weather.weathercode, timeOfDay);
		document.querySelector('#weather .icon').innerHTML = weather.icon
		document.querySelector('#weather .condition').innerHTML = _.capitalize(weather.condition);
		document.querySelector('#weather .temperature').innerHTML = `${data.current_weather.temperature} ${data.current_weather_units.temperature}`;
	})
	.catch((error) => {
		console.log(error);
	});