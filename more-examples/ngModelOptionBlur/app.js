'use strict';

var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate']);
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
myApp.controller('CtrlDirective', ['ValidationService', function (ValidationService) {
  var vmd = this;
  vmd.model = {};

  // use the ValidationService only to declare the controllerAs syntax
  var vs = new ValidationService({ controllerAs: vmd });

  vmd.input6 = "initialInput6";
  vmd.mylocation = { Name: "initialName", Name2: "initialName", Simple: "initialName" };

  vmd.submitForm = function() {
    if(vs.checkFormValidity(vmd.form1)) {
      alert('All good, proceed with submit...');
    }
  }
}]);
