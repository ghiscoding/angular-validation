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

  vmd.myCustomValidation1 = function() {
    // you can return a boolean for isValid or an objec (see the next function)
    var isValid = (vmd.model.input1 === "abc");
    return isValid;
  }

  vmd.myCustomValidation2 = function() {
    // or you can return an object as { isValid: bool, message: msg }
    var isValid = (vmd.model.input2 === "def");
    return { isValid: isValid, message: 'Returned error from custom function.'};
  }

  vmd.myIbanCheck1 = function(inputModel) {
    return { isValid: IBAN.isValid(inputModel), message: 'Invalid IBAN.' };
  }

  vmd.submitForm = function() {
    if(vs.checkFormValidity(vmd.form1)) {
      alert('All good, proceed with submit...');
    }
  }
}]);

// --
// Service
myApp.controller('CtrlService', ['$scope', 'ValidationService', function ($scope, ValidationService) {
  var vms = this;
  vms.model = {};

  // use the ValidationService only to declare the controllerAs syntax
  var vs = new ValidationService({ controllerAs: vms });

  vs.setGlobalOptions({ scope: $scope })
    .addValidator('input3', 'alpha|min_len:2|custom:vms.myCustomValidation3:alt=Alternate error message.|required')
    .addValidator('input4', 'alpha|min_len:2|custom:vms.myCustomValidation4|required')
    .addValidator('iban2', 'custom:vms.myIbanCheck2(vms.model.iban2)|required');

  vms.myCustomValidation3 = function() {
    // you can return a boolean for isValid or an objec (see the next function)
    var isValid = (vms.model.input3 === "abc");
    return isValid;
  }

  vms.myCustomValidation4 = function() {
    // or you can return an object as { isValid: bool, message: msg }
    var isValid = (vms.model.input4 === "def");
    console.log(isValid);
    return { isValid: isValid, message: 'Returned error from custom function.'};
  }

    vms.myIbanCheck2 = function(inputModel) {
      return { isValid: IBAN.isValid(inputModel), message: 'Invalid IBAN.' };
    }

  vms.submitForm = function() {
    if(new ValidationService().checkFormValidity(vms.form2)) {
      alert('All good, proceed with submit...');
    }
  }
}]);
