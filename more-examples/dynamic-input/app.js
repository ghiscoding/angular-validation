'use strict';

var myApp = angular.module('myApp', ['ngRoute', 'pascalprecht.translate', 'ghiscoding.validation']);

myApp.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider.when('/dynamic', {
          templateUrl: 'template.html',
          controller: 'CtrlDynamic'
    });
    $routeProvider.otherwise({
          redirectTo: 'dynamic',
    });
  }])
	.config(['$translateProvider', function ($translateProvider) {
	  $translateProvider.useStaticFilesLoader({
	    prefix: '../../locales/validation/',
	    suffix: '.json'
		});

  	// load English ('en') table on startup
		$translateProvider.preferredLanguage('en');
	}])
  .controller('CtrlDynamic', ['$scope', '$translate', function ($scope, $translate) {
    $scope.form1 = {};

    $scope.switchLanguage = function (key) {
      $translate.use(key);
    };

    $scope.data = [
      {
        'name': "abc",
        'title': 'first',
        'validate':"required"
      },
      {
        'name': "xyz",
        'title': 'second',
        'validate':"max_len:12|required"
      },
      {
        'name': "std",
        'title': 'third',
        'validate':"max_len:22|required"
      }
    ];
  }])
  .directive('dyninp', [ function () {
    return {
        restrict: 'AE',
        scope: {
            modal: '=',
            validate:'='
        },
        replace: true,
        template: '<input type="text" class="form-control" ng-model="modal" validation="{{validate}}" />',
        link: function (scope, element, attrs) {}
    }
  }]);