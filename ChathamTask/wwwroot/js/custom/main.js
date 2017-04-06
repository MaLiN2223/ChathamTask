
class WeatherRecord
{
    constructor(date,temperature){
        this.day = date;
        this.temperature = temperature;
    }
}
let app = angular.module('plunker', []); 
let parse = function(data)
{
    console.dir(data);
    output = [new WeatherRecord("today",data.currently.temperature)];
    let arr =data.futureForecasts;
    for(let i = 0; i < arr.length ;++i){
        output.push(new WeatherRecord(arr[i].date,arr[i].temperatureMin))
    }
    return output;

}
app.controller('MainCtrl', function ($scope, $http) {
    console.log("asdf");
    scope = $scope
    $scope.data = {}
    $scope.records = [
        new WeatherRecord("day1",-1),
        new WeatherRecord("day2",-2),
        new WeatherRecord("day3",-3),
        new WeatherRecord("day4",-4),
        new WeatherRecord("day5",-5),
        new WeatherRecord("day6",-6),
        new WeatherRecord("day7",-7),     
    ]
    //$scope.data.isVisible = undefined;
    //angular.element(function () { 
        // $http.get("http://178.79.140.126/api/forecast?latitude=50.06465009999999&longitude=19.9449799&source=WORLD_WEATHER").then(function (data) {
         //   $scope.records = parse(data.data);
       // });
    //});  
}); 
