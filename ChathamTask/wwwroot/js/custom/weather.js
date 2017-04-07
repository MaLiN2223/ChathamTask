class WeatherRecord {
    constructor(date, temperatureMin, temperatureMax, apparentTemperatureMin, apparentTemperatureMax, humidity, pressure, cloudCover) {
        this.date = date;
        this.temperature = { min: temperatureMin, max: temperatureMax, apparentMin: apparentTemperatureMin, apparentMax: apparentTemperatureMax };
        this.humidity = humidity;
        this.pressure = pressure;
        this.cloudCover = cloudCover;
    }
}

let APIUrl = "http://178.79.140.126/api/";
let weatherApp = angular.module('app', ["angucomplete-alt"]);

let parse = function (data) {
    console.dir(data);
    const today = new WeatherRecord("today", data.currently.temperature);

    let arr = data.futureForecasts;
    const output = [];
    for (let i = 0; i < arr.length; ++i) {
        output.push(new WeatherRecord(arr[i].date, arr[i].temperatureMin));
    }
    return { today: today, forecast: output };
}
let parseCity = function (cityData) {
    let tmp = cityData.structured_formatting;
    return {
        name: tmp.main_text,
        location: tmp.secondary_text,
        id: cityData.place_id
    }
}

weatherApp.controller('MainCtrl', function ($scope, $http, $q) {
    $scope.data = {}
    $scope.countries = {}
    $scope.data.isVisible = undefined;
    angular.element(function () {
        console.log("init");
    });
    $scope.cities = [];
    $scope.searchAPI = function (userInputString, timeoutPromise) {
        return $http.get(APIUrl + 'cities/search?byName=' + userInputString)
            .then(function (foo) {

                console.log("ok");
                $scope.cities = foo.data.predictions.map(parseCity);
                // console.log($scope.cities);
                // timeoutPromise.resolve($scope.cities, httpCanceller);
            });
    }
});
