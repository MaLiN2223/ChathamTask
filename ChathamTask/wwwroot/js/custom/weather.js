// API init
const API = {
    url: "http://codingchallenge.chathamfinancial.com/api/static/"
};
var locale = window.navigator.userLanguage || window.navigator.language;
moment.locale(locale);

(function () {
    API.cityByName = API.url + 'cities/search?byName=';
    API.locationArguments = function (latitude, longditude) {
        return 'latitude=' + latitude + '&longitude=' + longditude;
    };
    API.cityByLocation = function (latitude, longditude) {
        return API.url + 'cities?' + API.locationArguments(latitude, longditude);
    };
    API.forecastByLocation = function (latitude, longditude, source) {
        return API.url + 'forecast?' + API.locationArguments(latitude, longditude) + '&source=' + source;
    };
}
)();

// end API init
// Utils
let now = moment().hours(0);
let getDate = function (date) {
    let tmp = moment(date);
    let diff = Math.ceil(moment(date).hours(0).diff(now, "days", true));
    if (diff === 0) {
        return "Today";
    }
    else if (diff === 1) {
        return "Tomorrow";
    }
    else if (diff === 2) {
        return "After tomorrow";
    } else {
        return tmp.format("D MMMM");
    }
}
class ForecastRecord {
    constructor(data, id) {
        this.date = getDate(data.date);
        this.temperature = {
            min: data.temperatureMin,
            max: data.temperatureMax,
            apparentMin: data.apparentTemperatureMin,
            apparentMax: data.apparentTemperatureMax,
        };
        this.humidity = data.humidity;
        this.pressure = data.pressure;
        this.cloudCover = data.cloudCover;
        this.condition = "cloudy";
        this.id = id;
    }
}
class CurrentRecord {
    constructor(data) {
        this.date = "Now";
        this.temperature = data.temperature;
        this.humidity = data.humidity;
        this.pressure = data.pressure;
        this.cloudCover = data.cloudCover;
        this.condition = "cloudy";
        this.id = -1;
    }
}
let displaytWeatherFromForecast = function (obj) {
    return {
        date: obj.date,
        temperature: obj.temperature.max - obj.temperature.min,
        apparentTemperature: obj.temperature.apparentMax - obj.temperature.apparentMin,
        humidity: obj.humidity,
        pressure: obj.pressure,
        cloudCover: obj.cloudCover,
        condition: obj.condition,
        id: obj.id
    };
}
let displayWeatherFromCurrent = function (obj) {
    console.log(obj);
    return {
        date: obj.date,
        temperature: obj.temperature,
        apparentTemperature: obj.apparentTemperature,
        humidity: obj.humidity,
        pressure: obj.pressure,
        cloudCover: obj.cloudCover,
        condition: obj.condition,
        id: obj.id
    };
}

class CityData {
    constructor(name, location, id) {
        this.name = name;
        this.location = location;
        this.id = id;
    }
}

let parseWeather = function (data) {
    const today = new CurrentRecord(data.currently);
    let arr = data.futureForecasts;
    const output = [];
    for (let i = 0; i < arr.length; ++i) {
        output.push(new ForecastRecord(arr[i], i));
    }
    return { today: today, forecast: output };
}
let toDropdown = function (city) {
    return {
        title: city.name,
        subTitle: city.location,
        id: city.id
    };
}
let parseCity = function (cityData) {
    const tmp = cityData.structured_formatting;
    return toDropdown(new CityData(tmp.main_text, tmp.secondary_text, cityData.place_id));
}
// end Utils

let weatherApp = angular.module('app', ['autosuggest']);

weatherApp.factory('locationService', function ($q, $window, $http) {
    function getCurrentPosition() {
        let deferred = $q.defer();
        if ($window.navigator.geolocation) {
            $window.navigator.geolocation.getCurrentPosition(
                function (position) {
                    deferred.resolve(position);
                },
                function (err) {
                    deferred.reject(err);
                });
        }
        return deferred.promise;
    };
    function getCities(partialName) {
        return $http.get(API.cityByName + partialName);
    };
    function getCity(lat, long) {
        return $http.get(API.cityByLocation(lat, long));
    };
    return {
        getCurrentPosition: getCurrentPosition,
        getCities: getCities,
        getCity: getCity
    };
});

weatherApp.factory('weatherService', function ($http) {
    function getWeather(latitude, longditude, source) {
        return $http.get(API.forecastByLocation(latitude, longditude, source));
    }
    return {
        getWeather: getWeather
    }
});


weatherApp.controller('MainCtrl', function ($scope, $http, locationService, weatherService) {
    const init = function () {
        $scope.city = {}
        $scope.weather = {
            isVisible: false,
            source: "FORECAST_IO"
        }
        $scope.citiesParser = function (data) {
            data = data.data.predictions;
            return data.map(parseCity);
        };
        $scope.getCities = locationService.getCities;
        $scope.currentCity = undefined;
        $scope.changeDisplayed = function (a) {
            if (a === -1) {
                $scope.weather.displayed = $scope.weather.today;
            } else {
                $scope.weather.displayed = displaytWeatherFromForecast($scope.weather.forecast[a]);
            }

        };
        $scope.onCitySelect = function (e) {
            console.log(e);
        };
    };
    const refreshWeather = function () {
        $scope.weather.data = weatherService.getWeather($scope.city.latitude, $scope.city.longitude, $scope.weather.source)
            .then(function (response) {
                const parsed = parseWeather(response.data);
                $scope.weather.today = parsed.today;
                $scope.weather.displayed = displayWeatherFromCurrent(parsed.today);
                $scope.weather.forecast = parsed.forecast;
                $scope.weather.isVisible = true;
            });
    };
    const hideWeather = function (reason) {
        $scope.weather.isVisible = false;
        $scope.weather.problemReason = reason;
    };
    const setCityByCoords = function (lat, long) {
        locationService.getCity(lat, long).then(function (data) {
            data = data.data;
            [$scope.city.name, $scope.city.country] = data.formatted_address.split(",");
            $scope.city.id = data.place_id;
        });
    };
    const updateCityByCoords = function (coords) {
        $scope.city.latitude = coords.latitude;
        $scope.city.longitude = coords.longitude;
        setCityByCoords(coords.latitude, coords.longitude);
        refreshWeather();
    };
    const showWeather = function () {
        locationService.getCurrentPosition().then(function (data) {
            updateCityByCoords(data.coords);
        }, function () {
            $.getJSON("//freegeoip.net/json/?callback=?", function (data) {
                updateCityByCoords(data.coords);
            });
        });
    };
    angular.element(function () {
        init();
        showWeather();
    });
});

