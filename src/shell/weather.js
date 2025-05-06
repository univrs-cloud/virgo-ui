import weatherPartial from 'shell/partials/weather.html';
import weatherForecastPartial from 'shell/partials/weather_forecast.html';
import * as configurationService from 'shell/services/configuration';

// see https://open-meteo.com/en/docs

import iconClearDay from 'assets/img/weather/clear-day.svg';
import iconClearNight from 'assets/img/weather/clear-night.svg';
import iconPartlyCloudyDay from 'assets/img/weather/partly-cloudy-day.svg';
import iconPartlyCloudyNight from 'assets/img/weather/partly-cloudy-night.svg';
import iconOvercast from 'assets/img/weather/overcast.svg';
import iconFogDay from 'assets/img/weather/fog-day.svg';
import iconFogNight from 'assets/img/weather/fog-night.svg';
import iconPartlyCloudyDrizzleDay from 'assets/img/weather/partly-cloudy-day-drizzle.svg';
import iconPartlyCloudyDrizzleNight from 'assets/img/weather/partly-cloudy-night-drizzle.svg';
import iconOvercastDrizzleDay from 'assets/img/weather/overcast-day-drizzle.svg';
import iconOvercastDrizzleNight from 'assets/img/weather/overcast-night-drizzle.svg';
import iconDrizzle from 'assets/img/weather/drizzle.svg';
import iconPartlyCloudySleetDay from 'assets/img/weather/partly-cloudy-day-sleet.svg';
import iconPartlyCloudySleetNight from 'assets/img/weather/partly-cloudy-night-sleet.svg';
import iconSleet from 'assets/img/weather/sleet.svg';
import iconPartlyCloudyRainDay from 'assets/img/weather/partly-cloudy-day-rain.svg';
import iconPartlyCloudyRainNight from 'assets/img/weather/partly-cloudy-night-rain.svg';
import iconRain from 'assets/img/weather/rain.svg';
import iconOvercastRainDay from 'assets/img/weather/overcast-day-rain.svg';
import iconOvercastRainNight from 'assets/img/weather/overcast-night-rain.svg';
import iconOvercastRain from 'assets/img/weather/overcast-rain.svg';
import iconPartlyCloudySnowDay from 'assets/img/weather/partly-cloudy-day-snow.svg';
import iconPartlyCloudySnowNight from 'assets/img/weather/partly-cloudy-night-snow.svg';
import iconOvercastSnow from 'assets/img/weather/overcast-snow.svg';
import iconSnow from 'assets/img/weather/snow.svg';
import iconThunderstormsOvercast from 'assets/img/weather/thunderstorms-overcast.svg';
import iconThunderstormsExtremeRain from 'assets/img/weather/thunderstorms-extreme-rain.svg';
import morphdom from 'morphdom';

const wmo = {
	"0-day": "Sunny",
	"0-night": "Clear",
	"1-day": "Mainly Sunny",
	"1-night": "Mainly Clear",
	"2-day": "Partly Cloudy",
	"2-night": "Partly Cloudy",
	"3-day": "Cloudy",
	"3-night": "Cloudy",
	"45-day": "Foggy",
	"45-night": "Foggy",
	"48-day": "Foggy",
	"48-night": "Foggy",
	"51-day": "Light Drizzle",
	"51-night": "Light Drizzle",
	"53-day": "Drizzle",
	"53-night": "Drizzle",
	"55-day": "Heavy Drizzle",
	"55-night": "Heavy Drizzle",
	"56-day": "Light Freezing Drizzle",
	"56-night": "Light Freezing Drizzle",
	"57-day": "Freezing Drizzle",
	"57-night": "Freezing Drizzle",
	"61-day": "Light Rain",
	"61-night": "Light Rain",
	"63-day": "Rain",
	"63-night": "Rain",
	"65-day": "Heavy Rain",
	"65-night": "Heavy Rain",
	"66-day": "Light Freezing Rain",
	"66-night": "Light Freezing Rain",
	"67-day": "Heavy Freezing Rain",
	"67-night": "Heavy Freezing Rain",
	"71-day": "Light Snow",
	"71-night": "Light Snow",
	"73-day": "Snow",
	"73-night": "Snow",
	"75-day": "Heavy Snow",
	"75-night": "Heavy Snow",
	"77-day": "Snow Grains",
	"77-night": "Snow Grains",
	"80-day": "Slight Rain Showers",
	"80-night": "Slight Rain Showers",
	"81-day": "Rain Showers",
	"81-night": "Rain Showers",
	"82-day": "Violent Rain Showers",
	"82-night": "Violent Rain Showers",
	"85-day": "Slight Snow Showers",
	"85-night": "Slight Snow Showers",
	"86-day": "Heavy Snow Showers",
	"86-night": "HeavySnow Showers",
	"95-day": "Thunderstorm",
	"95-night": "Thunderstorm",
	"96-day": "Thunderstorm With Hail",
	"96-night": "Thunderstorm With Hail",
	"99-day": "Thunderstorm With Hail",
	"99-night": "Thunderstorm With Hail"
};

const conditions = [
	{
		code: 0,
		icon: {
			day: iconClearDay,
			night: iconClearNight
		},
	},
	{
		code: 1,
		icon: {
			day: iconClearDay,
			night: iconClearNight
		},
	},
	{
		code: 2,
		icon: {
			day: iconPartlyCloudyDay,
			night: iconPartlyCloudyNight
		},
	},
	{
		code: 3,
		icon: {
			day: iconOvercast,
			night: iconOvercast
		},
	},
	{
		code: 45,
		icon: {
			day: iconFogDay,
			night: iconFogNight
		},
	},
	{
		code: 48,
		icon: {
			day: iconFogDay,
			night: iconFogNight
		},
	},
	{
		code: 51,
		icon: {
			day: iconPartlyCloudyDrizzleDay,
			night: iconPartlyCloudyDrizzleNight
		},
	},
	{
		code: 53,
		icon: {
			day: iconOvercastDrizzleDay,
			night: iconOvercastDrizzleNight
		},
	},
	{
		code: 55,
		icon: {
			day: iconDrizzle,
			night: iconDrizzle
		},
	},
	{
		code: 56,
		icon: {
			day: iconPartlyCloudySleetDay,
			night: iconPartlyCloudySleetNight
		},
	},
	{
		code: 57,
		icon: {
			day: iconSleet,
			night: iconSleet
		},
	},
	{
		code: 61,
		icon: {
			day: iconPartlyCloudyRainDay,
			night: iconPartlyCloudyRainNight
		},
	},
	{
		code: 63,
		icon: {
			day: iconRain,
			night: iconRain
		},
	},
	{
		code: 65,
		icon: {
			day: iconRain,
			night: iconRain
		},
	},
	{
		code: 66,
		icon: {
			day: iconSleet,
			night: iconSleet
		},
	},
	{
		code: 67,
		icon: {
			day: iconSleet,
			night: iconSleet
		},
	},
	{
		code: 71,
		icon: {
			day: iconPartlyCloudySnowDay,
			night: iconPartlyCloudySnowNight
		},
	},
	{
		code: 73,
		icon: {
			day: iconPartlyCloudySnowDay,
			night: iconPartlyCloudySnowNight
		},
	},
	{
		code: 75,
		icon: {
			day: iconOvercastSnow,
			night: iconOvercastSnow
		},
	},
	{
		code: 77,
		icon: {
			day: iconPartlyCloudySnowDay,
			night: iconPartlyCloudySnowNight
		},
	},
	{
		code: 80,
		icon: {
			day: iconOvercastRainDay,
			night: iconOvercastRainNight
		},
	},
	{
		code: 81,
		icon: {
			day: iconOvercastRainDay,
			night: iconOvercastRainNight
		},
	},
	{
		code: 82,
		icon: {
			day: iconOvercastRain,
			night: iconOvercastRain
		},
	},
	{
		code: 85,
		icon: {
			day: iconSnow,
			night: iconSnow
		},
	},
	{
		code: 86,
		icon: {
			day: iconSnow,
			night: iconSnow
		},
	},
	{
		code: 95,
		icon: {
			day: iconThunderstormsOvercast,
			night: iconThunderstormsOvercast
		},
	},
	{
		code: 96,
		icon: {
			day: iconThunderstormsExtremeRain,
			night: iconThunderstormsExtremeRain
		},
	},
	{
		code: 99,
		icon: {
			day: iconThunderstormsExtremeRain,
			night: iconThunderstormsExtremeRain
		},
	}
];

const container = document.querySelector('#weather');
const weatherForecast = document.querySelector('#weather-forecast');
const weatherTemplate = _.template(weatherPartial);
const weatherForecastTemplate = _.template(weatherForecastPartial);
let fetchRetries = 5;
let fetchDelay = 60000;
let request = null;

const fetchData = async (state) => {
	if (request || _.isNull(state.configuration) || _.isUndefined(state.configuration.location) || _.isEmpty(state.configuration.location)) {
		return;
	}

	const latitude = state.configuration.location.latitude;
	const longitude = state.configuration.location.longitude;

	try {
		request = true;
		const weather = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&current_weather=true&temperature_unit=celsius&timezone=auto`);
		fetchRetries = 5;
		fetchDelay = 60000;
		render({ location: null, weather: weather.data });
	} catch (error) {
		console.log(error);
		fetchRetries--;
		fetchDelay = 1000;
	} finally {
		request = null;
		if (fetchRetries > 0) {
			setTimeout(() => {
				fetchData({ configuration: configurationService.getConfiguration() });
			}, fetchDelay);
		}
	};
};

const render = (state) => {
	if (_.isUndefined(state.weather.current_weather)) {
		return;
	}

	let timeOfDay = (state.weather.current_weather.time > state.weather.daily.sunrise[0] && state.weather.current_weather.time < state.weather.daily.sunset[0] ? 'day' : 'night');
	let weather = weatherCondition(state.weather.current_weather.weathercode, timeOfDay);
	weather.temperature = `${state.weather.current_weather.temperature?.toFixed(0)} ${state.weather.current_weather_units.temperature}`;
	morphdom(
		container,
		weatherTemplate({ weather })
	);
	morphdom(
		weatherForecast,
		weatherForecastTemplate(),
		{ childrenOnly: true }
	);

	function weatherCondition(weatherStatusCode, timeOfDay) {
		const mapping = conditions.find((condition) => { return condition.code === weatherStatusCode; });
		return {
			icon: mapping.icon[timeOfDay],
			condition: wmo[`${weatherStatusCode}-${timeOfDay}`]
		};
	};
};

const popover = new bootstrap.Popover(container, {
	content: () => {
		return '';
		// return weatherForecast.innerHTML;
	},
	html: true,
	trigger: 'hover',
	placement: 'bottom'
});

configurationService.subscribe([fetchData]);
