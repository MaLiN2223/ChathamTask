class WeatherRecord {
    constructor(date, temperatureMin, temperatureMax, apparentTemperatureMin, apparentTemperatureMax, humidity, pressure, cloudCover) {
        this.date = date;
        this.temperature = { min: temperatureMin, max: temperatureMax, apparentMin: apparentTemperatureMin, apparentMax: apparentTemperatureMax };
        this.humidity = humidity;
        this.pressure = pressure;
        this.cloudCover = cloudCover;
    }
}


let weatherApp = angular.module('app', ['autocomplete']);

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
weatherApp.factory('WeatherRetriever', function ($http, $q, $timeout) {
    var WeatherRetriever = new Object();
    WeatherRetriever.getmovies = function (i) {

        var moviedata = $q.defer();
        var movies; 
        var moreMovies = ["The Wolverine", "The Smurfs 2", "The Mortal Instruments: City of Bones", "Drinking Buddies", "All the Boys Love Mandy Lane", "The Act Of Killing", "Red 2", "Jobs", "Getaway", "Red Obsession", "2 Guns", "The World's End", "Planes", "Paranoia", "The To Do List", "Man of Steel", "The Way Way Back", "Before Midnight", "Only God Forgives", "I Give It a Year", "The Heat", "Pacific Rim", "Kevin Hart: Let Me Explain", "A Hijacking", "Maniac", "After Earth", "The Purge", "Much Ado About Nothing", "Europa Report", "Stuck in Love", "We Steal Secrets: The Story Of Wikileaks", "The Croods", "This Is the End", "The Frozen Ground", "Turbo", "Blackfish", "Frances Ha", "Prince Avalanche", "The Attack", "Grown Ups 2", "White House Down", "Lovelace", "Girl Most Likely", "Parkland", "Passion", "Monsters University", "R.I.P.D.", "Byzantium", "The Conjuring", "The Internship"]

        if (i && i.indexOf('T') != -1)
            movies = moreMovies;
        else
            movies = moreMovies;

        $timeout(function () {
            moviedata.resolve(movies); 
        }, 1000);

        return moviedata.promise;
    } 
    return WeatherRetriever;
});


//weatherApp.controller('MainCtrl', function ($scope, $http, WeatherRetriever) {
//    $scope.data = {} 
//    $scope.data.isVisible = undefined;
//    angular.element(function () {
//        $http.get("http://178.79.140.126/api/forecast?latitude=50.06465009999999&longitude=19.9449799&source=WORLD_WEATHER").then(function (data) {
//            $scope.weather = parse(data.data);
//        });
//    });
//    $scope.movies = WeatherRetriever.getmovies("...");
//    $scope.movies.then(function (data) {
//        $scope.movies = data;
//    });

//    $scope.getmovies = function() {
//        return $scope.movies;
//    };
//    $scope.doSomething = function (typedthings) {
//        console.log("Do something like reload data with this: " + typedthings);
//        $scope.newmovies = MovieRetriever.getmovies(typedthings);
//        $scope.newmovies.then(function (data) {
//            $scope.movies = data;
//        });
//    }
//});

weatherApp.controller('MainCtrl', function ($scope, WeatherRetriever) {
    $scope.movies = WeatherRetriever.getmovies("");

    $scope.movies.then(function (data) {
        console.log("Get then");
        $scope.movies = data;
    });

    $scope.getmovies = function () {
        console.log("Get movies");
        return $scope.movies;
    }

    $scope.doSomething = function (typedthings) { 
        console.log("Do something like reload data with this: " + typedthings);
        $scope.newmovies = WeatherRetriever.getmovies(typedthings);
        $scope.newmovies.then(function (data) {
            $scope.movies = data;
        });
    }

});
