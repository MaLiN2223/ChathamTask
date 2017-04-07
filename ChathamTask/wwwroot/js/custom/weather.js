class WeatherRecord {
    constructor(date, temperatureMin, temperatureMax, apparentTemperatureMin, apparentTemperatureMax, humidity, pressure, cloudCover) {
        this.date = date;
        this.temperature = { min: temperatureMin, max: temperatureMax, apparentMin: apparentTemperatureMin, apparentMax: apparentTemperatureMax };
        this.humidity = humidity;
        this.pressure = pressure;
        this.cloudCover = cloudCover;
    }
}

let weatherApp = angular.module('app', ["angucomplete"]);

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


weatherApp.controller('MainCtrl', function ($scope, $http) {
    $scope.data = {}
    $scope.countries = {}
    $scope.data.isVisible = undefined;
    angular.element(function () {
        $http.get("http://178.79.140.126/api/forecast?latitude=50.06465009999999&longitude=19.9449799&source=WORLD_WEATHER").then(function (data) {
            $scope.weather = parse(data.data);
        });
    });

});
