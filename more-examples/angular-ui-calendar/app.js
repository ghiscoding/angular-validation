'use strict';

var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate', 'ui.bootstrap']);

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
['$scope', '$translate', 'ValidationService', '$timeout',
function ($scope, $translate, ValidationService, $timeout) {
  var vm = this;
  vm.model = {};
  vm.validationRequired = false;
  vm.isChangeDatePickerOpen = false;
  vm.datePickerFormat = 'dd/MM/yyyy';
  vm.dateOptions = { formatYear: 'yy' };

  vm.minDate = new Date(); // 10 years ago
  vm.minDate.setHours(0,0,0,0);
  vm.minDate.setMonth(vm.minDate.getMonth() - 12 * 10);
  vm.maxDate = new Date(); // now
  vm.maxDate.setHours(0,0,0,0);

  this.openDatePicker = function($event) {
    console.log("openDatePicker()", vm.isChangeDatePickerOpen);
    $event.preventDefault();
    $event.stopPropagation();
    vm.isChangeDatePickerOpen = true;
  };

  var validation = new ValidationService({
    controllerAs: vm,
    preValidateFormElements: false
  });

  vm.checkboxChange = function() {
    validation.checkFormValidity(vm.test); // force validation
  }
}]);
