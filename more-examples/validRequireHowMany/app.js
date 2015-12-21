'use strict';

var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate', 'ui.bootstrap']);
// --
// configuration
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
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
	}]);

// --
// Directive
myApp.controller('CtrlDirective', ['validationService', function (validationService) {
  var vmd = this;
  vmd.model = {};

  // use the validationService only to declare the controllerAs syntax
  var vs = new validationService({ controllerAs: vmd });

  vmd.submitForm = function() {
    if(vs.checkFormValidity(vmd.form1)) {
      alert('All good, proceed with submit...');
    }
  }
}]);

// --
// Service
myApp.controller('CtrlService', ['$scope', 'validationService', function ($scope, validationService) {
  var vms = this;
  vms.model = {};

  // use the validationService only to declare the controllerAs syntax
  var vs = new validationService({ controllerAs: vms });

  vs.addValidator({
    elmName: 'input2',
    validRequireHowMany: 2,
    scope: $scope,
    rules: 'ipv4|ipv6|required'
  });

  vms.submitForm = function() {
    if(new validationService().checkFormValidity(vms.form2)) {
      alert('All good, proceed with submit...');
    }
  }
}]);
