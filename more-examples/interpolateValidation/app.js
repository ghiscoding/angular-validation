'use strict';

var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate']);

myApp.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }])
	.config(['$translateProvider', function ($translateProvider) {
	  $translateProvider.useStaticFilesLoader({
      prefix: '../../locales/validation/',
      suffix: '.json'
    });
  	// load English ('en') table on startup
		$translateProvider.preferredLanguage('en').fallbackLanguage('en');
	}]);

myApp.controller('Ctrl',
['$scope', '$translate', 'ValidationService',
function ($scope, $translate, ValidationService) {
  var vm = this;
  vm.model = {};
  vm.validationRequired = true;
  var validation = new ValidationService({ controllerAs: vm, preValidateFormElements: true });

  vm.f1Validation = function () {
    return vm.validationRequired ? 'required' : '';
  }

  vm.if1Validation = function () {
    return vm.validationRequired ? '' : 'required';
  }

  vm.checkboxChange = function() {
    //console.log('vm.f1Validation()', '['+vm.f1Validation()+']');
    //console.log('vm.if1Validation()', '['+vm.if1Validation()+']');
    validation.checkFormValidity(vm.test); // force validation
  }
}]);
