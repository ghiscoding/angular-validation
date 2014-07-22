'use strict';

var myApp = angular.module('myApp', ['ngRoute', 'pascalprecht.translate', 'ghiscoding.validation']);

myApp.config(function ($routeProvider, $locationProvider) {
    $routeProvider.when('/validate', {
          templateUrl: 'templates/testingForm.html',
          controller: 'Ctrl'
    });
    $routeProvider.otherwise({
          redirectTo: 'validate',
    });
  })
	.config(function ($translateProvider) {
	  $translateProvider.useStaticFilesLoader({
	    prefix: 'locales/validation/',
	    suffix: '.json'
		});
  
  	// load English ('en') table on startup
		$translateProvider.preferredLanguage('en');
	});

myApp.controller('Ctrl', ['$scope', '$translate', function ($scope, $translate) {
  $scope.form1 = {};
  
  $scope.switchLanguage = function (key) {
    $translate.use(key);
  };
}]);