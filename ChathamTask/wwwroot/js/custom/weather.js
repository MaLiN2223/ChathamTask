// API init

const API = {
    url: "http://codingchallenge.chathamfinancial.com/api/"
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
    API.cityById = function (id) {
        return API.url + 'cities/' + id;
    }
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
    if (diff === 1) {
        return "Tomorrow";
    } else {
        return tmp.format("dddd");
    }
};

Number.prototype.round = function (q = 1) {
    return Number((this.toFixed(q)));
};

class Record {
    constructor(humidity, pressure, clouds) {
        this.humidity = humidity.round();
        this.pressure = pressure.round(0);
        this.clouds = clouds;
    }
    get pressureDescription() {
        return `${this.pressure} hPa`;
    }
    get humidityDescription() {
        let hum = (this.humidity * 100).round();
        return `${hum}%`;
    }
    get coverDescription() {
        let c = this.clouds;
        if (c == 0)
            return "Clear sky";
        if (c <= 0.25)
            return "Scattered clouds";
        if (c <= 0.375)
            return "Lightly cloudly";
        if (c <= 0.5)
            return "Partly cloudly";
        if (c <= 0.625)
            return "Cloudly";
        if (c <= 0.75)
            return "Mostly cloudly";
        if (c < 0.875)
            return "Nearly overcast";
        if (c < 1)
            return "Overcast";
        return "Sky obscured";
    }
};

class ForecastRecord extends Record {
    constructor(data, id, unit) {
        super(data.humidity, data.pressure, data.cloudCover);
        this.date = getDate(data.date);
        this.temperature = {
            min: data.temperatureMin.round(),
            max: data.temperatureMax.round(),
            apparentMin: data.apparentTemperatureMin.round(),
            apparentMax: data.apparentTemperatureMax.round()
        };
        this.condition = "cloudy";
        this.id = id;
        this.unit = unit;
        this.expanded = true;
        this.unit = "Fahrenheit";
    }
    get average() {
        return ((this.temperature.min + this.temperature.max) / 2).round();
    }
    get apparentAverage() {
        return ((this.temperature.apparentMin + this.temperature.apparentMax) / 2).round();
    }
}

class CurrentRecord extends Record {
    constructor(data) {
        super(data.humidity, data.pressure, data.cloudCover);
        this.date = "Now";
        this.temperature = data.temperature.round();
        this.apparentTemperature = data.apparentTemperature.round();
        this.id = -1;
        this.expanded = false;
        this.unit = "Fahrenheit";
    }
}

/// changes record's unit Celcius <-> Fahrenheit

swapRecordUnit = function (record) {
    if (record.id === -1) { // current (CurrentRecord)
        if (record.unit[0] === "F") {
            record.temperature = ((record.temperature - 32) / 1.8).round();
            record.apparentTemperature = ((record.apparentTemperature - 32) / 1.8).round();
            record.unit = "Celcius";
        }
        else {
            record.temperature = ((record.temperature * 1.8) + 32).round();
            record.apparentTemperature = ((record.apparentTemperature * 1.8) + 32).round();
            record.unit = "Fahrenheit";
        }
    }
    else { // forecast (ForecastRecord)
        if (record.unit[0] === "F") {
            record.temperature.min = ((record.temperature.min - 32) / 1.8).round();
            record.temperature.max = ((record.temperature.max - 32) / 1.8).round();
            record.temperature.apparentMin = ((record.temperature.apparentMin - 32) / 1.8).round();
            record.temperature.apparentMax = ((record.temperature.apparentMax - 32) / 1.8).round();
            record.unit = "Celcius";
        }
        else {
            record.temperature.min = ((record.temperature.min * 1.8) + 32).round();
            record.temperature.max = ((record.temperature.max * 1.8) + 32).round();
            record.temperature.apparentMin = ((record.temperature.apparentMin * 1.8) + 32).round();
            record.temperature.apparentMax = ((record.temperature.apparentMax * 1.8) + 32).round();
            record.unit = "Fahrenheit";
        }
    }
    return record;
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
/// converts city data for dropdown format
let toDropdown = function (city) {
    return {
        title: city.name,
        subTitle: city.location,
        id: city.id
    };
}
let parseCity = function (cityData) {
    const tmp = cityData.structured_formatting;
    return toDropdown({ name: tmp.main_text, location: tmp.secondary_text, id: cityData.place_id });
}
// end Utils

let weatherApp = angular.module('app', ['autosuggest', 'ui.toggle']);

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
    function getCityDataById(id) {
        return $http.get(API.cityById(id));
    };
    return {
        getCurrentPosition: getCurrentPosition,
        getCities: getCities,
        getCity: getCity,
        getCityDataById: getCityDataById
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

weatherApp.controller('MainCtrl', function ($scope, $http, $sce, locationService, weatherService) {

    const refreshWeather = function () {
        $scope.isRefreshing = true;
        $scope.weather.data = weatherService.getWeather($scope.city.latitude, $scope.city.longitude, $scope.source)
            .then(function (response) {
                const parsed = parseWeather(response.data);
                $scope.weather.today = parsed.today;
                $scope.weather.displayed = parsed.today;
                $scope.weather.forecast = parsed.forecast;
                $scope.weather.isVisible = true;
                $scope.isRefreshing = false;
                $scope.changeDegrees();
            });
    };
    const setCityByCoords = function (lat, long) {
        $scope.isRefreshing = true;
        locationService.getCity(lat, long).then(function (data) {
            data = data.data;
            [$scope.city.name, $scope.city.country] = data.formatted_address.split(",");
            $scope.city.id = data.place_id;
            $scope.broadcast();
        });
    };
    const setCityById = function (id) {
        $scope.isRefreshing = true;
        locationService.getCityDataById(id).then(function (response) {
            let data = response.data.result;
            $scope.city.latitude = data.geometry.location.lat;
            $scope.city.longitude = data.geometry.location.lng;
            refreshWeather();
        });
    }
    const updateCityByCoords = function (coords) {
        $scope.city.latitude = coords.latitude;
        $scope.city.longitude = coords.longitude;
        setCityByCoords(coords.latitude, coords.longitude);
    };
    // locates user by browser's position or via freegeoip (using IP)
    const locate = function () { 
        $scope.isRefreshing = true;
        locationService.getCurrentPosition().then(function (data) {
            updateCityByCoords(data.coords);
        }, function () {
            $.getJSON("//freegeoip.net/json/?callback=?", function (data) {
                updateCityByCoords(data);
            });
        });
    };
    // inits
    const initScopeVariables = function () {
        $scope.degreesDict = {
            "Celcius": $sce.trustAsHtml("&#8451"),
            false: $sce.trustAsHtml("&#8451"),
            "Fahrenheit": $sce.trustAsHtml("&#8457"),
            true: $sce.trustAsHtml("&#8457")
        };
        $scope.apiDict = {
            "forecast.io": "FORECAST_IO",
            true: "FORECAST_IO",
            "World Weather": "WORLD_WEATHER",
            false: "WORLD_WEATHER"
        };
        $scope.city = {};
        $scope.apiValue = "World Weather";
        $scope.degreesValue = "Fahrenheit";
        $scope.source = "";
        $scope.weather = {
            isVisible: false
        };
        $scope.getCities = locationService.getCities;
        $scope.currentCity = undefined;
    };
    const initScopeFunctions = function () {
        $scope.changeDegrees = function () {

            var unit = $scope.degreesValue;
            if ($scope.weather.today !== undefined && $scope.weather.today.unit !== unit) {
                $scope.weather.today = swapRecordUnit($scope.weather.today);
            }

            if ($scope.weather.forecast !== undefined) {
                $scope.weather.forecast = $scope.weather.forecast.map(function (element) {
                    if (element.unit !== unit) {
                        return swapRecordUnit(element);
                    }
                    return element;
                });
            }
            $scope.unit = $scope.degreesDict[unit];
        }
        $scope.changeApi = function (noRefresh) {
            $scope.source = $scope.apiDict[$scope.apiValue];
            if (!noRefresh)
                refreshWeather();
        };


        $scope.broadcast = function () {
            $scope.$broadcast('changeCityName', {
                target: ['a'],
                city: {
                    name: $scope.city.name,
                    id: $scope.city.id
                }
            });
        };
        $scope.citiesParser = function (data) {
            data = data.data.predictions;
            return data.map(parseCity);
        };
        $scope.changeDisplayed = function (a) {
            if (a === -1) {
                refreshWeather();
                $scope.weather.displayed = $scope.weather.today;
            } else {
                $scope.weather.displayed = $scope.weather.forecast[a];
            }
        };
        $scope.onCitySelect = function (e) {
            setCityById(e.id);
        };
    };
    const initScopeViaFunctions = function () {
        $scope.changeDegrees();
        $scope.changeApi(true);
    };
    const init = function () {
        initScopeVariables();
        initScopeFunctions();
        locate();
        initScopeViaFunctions();

    };
    // end inits
    angular.element(function () {
        init();
    });
});

