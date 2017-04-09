// API init
const API = {
    url: "http://178.79.140.126/api/"
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
        this.image = "/images/sun.jpeg";
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
        this.image = "/images/sun.jpeg";
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
        image: obj.image,
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
        image: obj.image,
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
let parseCity = function (cityData) {
    const tmp = cityData.structured_formatting;
    return new CityData(tmp.main_text, tmp.secondary_text, cityData.place_id);
}
// end Utils

let weatherApp = angular.module('app', []);

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
    }
    function getCities(partialName) {
        return $http.get(API.cityByName + partialName);
    }
    return {
        getCurrentPosition: getCurrentPosition,
        getCities: getCities
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
        $scope.cities = [];
        $scope.data = {}
        $scope.weather = {
            isVisible: false,
            source: "WORLD_WEATHER"
        }
        $scope.countries = {}
        $scope.changeDisplayed = function (a) {
            console.log(a);
            if (a === -1) {
                $scope.weather.displayed = $scope.weather.today;
            } else {
                console.log("changing to ");
                console.log(displaytWeatherFromForecast($scope.weather.forecast[a]));
                $scope.weather.displayed = displaytWeatherFromForecast($scope.weather.forecast[a]);
            }

        }
    };
    const refreshWeather = function () {
        console.log("refreshing");
        $scope.weather.data = weatherService.getWeather($scope.position.latitude, $scope.position.longitude, $scope.weather.source)
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
    }
    const showWeather = function () {
        locationService.getCurrentPosition().then(function (data) {
            $scope.position = {
                latitude: data.coords.latitude,
                longitude: data.coords.longitude
            }
            refreshWeather();
        }, function () {
            //TODO : create this service on 178.79.140.126
            $.getJSON('//freegeoip.net/json/?callback=?', function (data) {
                $scope.position = {
                    latitude: data.latitude,
                    longitude: data.longitude
                }
                refreshWeather();
            });
        });
    };

    angular.element(function () {
        init();
        showWeather();
    });
});
