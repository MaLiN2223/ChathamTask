let autosuggest = angular.module('autosuggest', []);


autosuggest.directive("autosuggest", function () {

    return {
        template: '\
        <div class="dropdown">\
            <div class="input-group" >\
                <input id="autosuggestFocus" type="text" class="autosuggest-input" ng-model="searchCity" placeholder={{attributes.placeholder}} ng-blur="onBlur()" ng-focus="onClick()" >\
                <span class="glyphicon glyphicon-search" ng-click="focusInput()"></span>\
            </div>\
            <div>\
                    <ul ng-if="displayed" class="autosuggest-dropdown">\
                        <li ng-repeat="item in cities" ng-click="select(item)">\
                            <a class="title">{{item.title}}</a>\
                            <a class="subtitle">{{item.subTitle}}</a>\
                        </li>\
                    </ul>\
                </div>\
        </div>\
        ',
        scope: {
            onCitySelect: "=",
            getCities: "=",
            parser: "="
        },
        link: function ($scope) {
            $scope.focusInput = function () {
                angular.element(document.querySelector('#autosuggestFocus')).focus();
            };
        },
        controller: [
            '$scope', function ($scope) {
                $scope.onBlur = function () {
                    setTimeout(function () {
                        $scope.displayed = false;
                        $scope.$apply();
                    },
                        200);
                };
                $scope.onClick = function () {

                    if ($scope.searchCity !== undefined && $scope.searchCity !== "")
                        $scope.displayed = true;
                };
                $scope.select = function (e) {
                    $scope.onCitySelect(e);
                    $scope.searchCity = e.title;
                };
                $scope.displayed = false;
                $scope.attributes = {
                    "placeholder": "Find your city ...",
                };
                $scope.$watch('searchCity',
                    function (newCity, oldCity) {
                        if (newCity === oldCity) return;

                        $scope.displayed = true;
                        $scope.getCities(newCity).then(function (data) {
                            $scope.cities = $scope.parser(data);
                        });
                    });
                $scope.$watch('cities',
                    function (newCities, foo2) {
                        console.log("new cities");
                    });

                this.city = "";
                this.update = function () {
                    console.log(this.searchCity);
                };
            }
        ],
    }

});