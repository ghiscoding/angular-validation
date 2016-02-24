'use strict';

var myApp = angular.module('myApp', ['ngRoute', 'ghiscoding.validation', 'pascalprecht.translate']);

myApp.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }])
	.config(['$routeProvider', '$translateProvider', function ($routeProvider, $translateProvider) {
	  $translateProvider.useStaticFilesLoader({
      prefix: '../../locales/validation/',
      suffix: '.json'
    });

  	// load English ('en') table on startup
		$translateProvider.preferredLanguage('en').fallbackLanguage('en');

	  $routeProvider
        .when('/First', {
          template: '<div>First Content</div>'
                   +'<form name="vm.firstForm">'
                   +'<input name="firstField" ng-model="vm.model.firstField" validation="required">'
                   +'</form>'
                   +'<div class="col-xs-12 alert alert-danger alert-dismissable" ng-show="vm.firstForm.$validationSummary.length > 0">'
                   +'<ul>'
                   +'<li ng-repeat="item in vm.firstForm.$validationSummary">{{ item.field }}: {{item.message}}</li>'
                   +'</ul>'
                   +'</div>',
          controller: 'FirstCtrl',
          controllerAs: 'vm'
        })
        .when('/Second', {
          template: '<div>Second Content</div>'
                   +'<form name="vm.secondForm">'
                   +'<input name="secondField" ng-model="vm.model.secondField" validation="required">'
                   +'</form>'
                   +'<div class="col-xs-12 alert alert-danger alert-dismissable" ng-show="vm.secondForm.$validationSummary.length > 0">'
                   +'<ul>'
                   +'<li ng-repeat="item in vm.secondForm.$validationSummary">{{ item.field }}: {{item.message}}</li>'
                   +'</ul>'
                   +'</div>',
          controller: 'SecondCtrl',
          controllerAs: 'vm'
        })
        .otherwise({ redirectTo: '/First' });
    }]);

myApp.controller('Ctrl', [
  'ValidationService',
  function (ValidationService) {
    var vm = this;
    vm.model = {};
    var v1 = new ValidationService({ controllerAs: vm, resetGlobalOptionsOnRouteChange: false });
  }]);

myApp.controller('FirstCtrl', [
  'ValidationService',
  function (ValidationService) {
    var vm = this;
    vm.model = {};
    var v2 = new ValidationService({ controllerAs: vm });
  }
]);

myApp.controller('SecondCtrl', [
  'ValidationService',
  function (ValidationService) {
    var vm = this;
    vm.model = {};
    var v3 = new ValidationService({ controllerAs: vm });
  }
]);