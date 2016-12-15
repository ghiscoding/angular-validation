'use strict';

var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate', 'ngTagsInput', 'angularjs-dropdown-multiselect',
    'hljs', 'isteven-multi-select']);

myApp.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }])
  .config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: 'https://rawgit.com/ghiscoding/angular-validation/master/locales/validation/',
      suffix: '.json'
    });
    // load English ('en') table on startup
    $translateProvider.preferredLanguage('en').fallbackLanguage('en');
  }]);

myApp.controller('Ctrl', ['$scope','ValidationService', function ($scope,ValidationService) {


    var validationService = new ValidationService({ scope: $scope, isolatedScope: $scope });

    $scope.select1model = [];
    $scope.select1data = [
        {id: 1, label: "Joe"},
        {id: 2, label: "John"},
        {id: 3, label: "Jane"}
    ];

    $scope.submit = function () {
        if (validationService.checkFormValidity($scope.test)) {
            alert('valid');
        }
    };
}]);
