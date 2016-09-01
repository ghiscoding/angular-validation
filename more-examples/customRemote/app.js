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
myApp.controller('CtrlDirective', ['$q', 'ValidationService', function ($q, ValidationService) {
  var vmd = this;
  vmd.model = {};

  // use the ValidationService only to declare the controllerAs syntax
  var vs = new ValidationService({ controllerAs: vmd, debounce: 500 });

  vmd.myRemoteValidation1 = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      var isValid = (vmd.model.input1 === "abc") ? true : false;
      deferred.resolve({ isValid: isValid, message: 'Returned error from promise.'});
    }, 500);

    return deferred.promise;
  }

  vmd.myRemoteValidation2 = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      var isValid = (vmd.model.input2 === "def") ? true : false;
      deferred.resolve({ isValid: isValid, message: 'Returned error from promise.'});
    }, 500);

    return deferred.promise;
  }

  vmd.submitForm = function() {
    if(vs.checkFormValidity(vmd.form1)) {
      alert('All good, proceed with submit...');
    }
  }
}]);

// --
// Service
myApp.controller('CtrlService', ['$scope', '$q', 'ValidationService', function ($scope, $q, ValidationService) {
  var vms = this;
  vms.model = {};

  // use the ValidationService only to declare the controllerAs syntax
  var vs = new ValidationService({ controllerAs: vms, debounce: 500 });

  vs.setGlobalOptions({ scope: $scope })
    .addValidator('input3', 'alpha|min_len:2|remote:vms.myRemoteValidation3:alt=Alternate error message.|required')
    .addValidator('input4', 'alpha|min_len:2|remote:vms.myRemoteValidation4()|required');

  vms.myRemoteValidation3 = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      var isValid = (vms.model.input3 === "abc") ? true : false;
      deferred.resolve({ isValid: isValid, message: 'Returned error from promise.'});
    }, 100);

    return deferred.promise;
  }

  vms.myRemoteValidation4 = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      var isValid = (vms.model.input4 === "def") ? true : false;
      deferred.resolve({ isValid: isValid, message: 'Returned error from promise.'});
    }, 500);

    return deferred.promise;
  }

  vms.submitForm = function() {
    if(new ValidationService().checkFormValidity(vms.form2)) {
      alert('All good, proceed with submit...');
    }
  }
}]);