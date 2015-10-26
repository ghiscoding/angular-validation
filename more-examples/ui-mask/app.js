'use strict';

var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate', 'ui.mask']);

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
['$scope', '$translate', 'validationService', '$timeout',
function ($scope, $translate, validationService, $timeout) {
  var vm = this;
  vm.model = {};

  function next(form) {
     var vs = new validationService();
     if (vs.checkFormValidity(form)) {
        // proceed to another view
     };
  }
}]);
