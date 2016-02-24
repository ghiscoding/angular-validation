'use strict';

var myApp = angular.module('myApp', ['ngRoute', 'ngSanitize', 'ghiscoding.validation', 'pascalprecht.translate']);

myApp.config(['$compileProvider', '$locationProvider', '$routeProvider', function ($compileProvider, $locationProvider, $routeProvider) {
    $compileProvider.debugInfoEnabled(false);
    $routeProvider
      .when('/validate-directive', { templateUrl: 'templates/testingFormDirective.html', controller: 'CtrlValidationDirective' })
      .when('/validate-2forms', { templateUrl: 'templates/testing2Forms.html', controller: 'Ctrl2forms as vm' })
      .when('/validate-ngRepeat', { templateUrl: 'templates/testingFormNgRepeat.html', controller: 'CtrlNgRepeat' })
      .when('/validate-service', { templateUrl: 'templates/testingFormService.html', controller: 'CtrlValidationService' })
      .otherwise({ redirectTo: 'validate-directive'  });
  }])
	.config(['$translateProvider', function ($translateProvider) {
	  $translateProvider.useStaticFilesLoader({
	    prefix: 'locales/validation/',
	    suffix: '.json'
		});

  	// load English ('en') table on startup
		$translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
	}]);

// -- Main page Controller
// ---------------------------------------------------
myApp.controller('Ctrl', ['$location', '$route', '$scope', '$translate', function ($location, $route, $scope, $translate) {
  // change the translation language & reload the page to make sure all errors were rendered properly
  $scope.switchLanguage = function (key) {
    $translate.use(key).then(function() {
      $route.reload();
    });
  };
  $scope.goto = function ( path ) {
    $location.path( path );
  };
}]);

// -- Controller to use Angular-Validation Directive
// -----------------------------------------------
myApp.controller('CtrlValidationDirective', ['$q', '$scope', 'ValidationService', function ($q, $scope, ValidationService) {
  // you can change default debounce globally
  $scope.$validationOptions = { debounce: 1500, preValidateFormElements: false };

  // if we want to use the invalid_pattern_data locale translation as an alternateText (:alt=)
  // then we need to supply an extra 'data' variable (as defined in the JSON locale) of what we expect the search pattern on our input4
  $scope.translationData = { data: 'YYWW' };

  // remove a single element ($scope.form1, string)
  // OR you can also remove multiple elements through an array type .removeValidator($scope.form1, ['input2','input3'])
  $scope.removeInputValidator = function ( elmName ) {
    new ValidationService().removeValidator($scope.form1, elmName);
  };
  $scope.resetForm = function() {
    new ValidationService().resetForm($scope.form1);
  };
  $scope.submitForm = function() {
    if(new ValidationService().checkFormValidity($scope.form1)) {
      alert('All good, proceed with submit...');
    }
  }

  $scope.showValidationSummary = function () {
    $scope.displayValidationSummary = true;
  }

  $scope.customRemoteValidationCall = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      var isValid = ($scope.input1 === "abc") ? true : false;

      // you can return a boolean for isValid
      //deferred.resolve(isValid);

      // or you can return an object as { isValid: bool, message: msg }
      deferred.resolve({ isValid: isValid, message: 'Returned error from promise.'});
    }, 1000);

    return deferred.promise;
  }
}]);

// -- Controller to use Angular-Validation Directive with 2 forms
// on this page we will pre-validate the form and show all errors on page load
// ---------------------------------------------------------------
myApp.controller('Ctrl2forms', ['ValidationService', function (ValidationService) {
  var vm = this; // use the ControllerAs alias syntax

  // set the global options BEFORE any function declarations, we will prevalidate current form
  var myValidationService = new ValidationService({ controllerAs: vm, debounce: 500, preValidateFormElements: true });

  vm.submitForm = function() {
    if(myValidationService.checkFormValidity(vm.form01)) {
      alert('All good, proceed with submit...');
    }
  }
  vm.resetForm = function(form) {
    myValidationService.resetForm(form, { emptyAllInputValues: true, removeAllValidators: true });
  };
  vm.showValidationSummary = function () {
    vm.displayValidationSummary = true;
  }
}]);

// -- Controller to use Angular-Validation Service
// -----------------------------------------------

// exact same testing form used except that all validators are programmatically added inside controller via Angular-Validation Service
myApp.controller('CtrlValidationService', ['$q', '$scope', '$translate', 'ValidationService', function ($q, $scope, $translate, ValidationService) {
  // start by creating the service
  var myValidation = new ValidationService();

  // you can create indepent call to the validation service
  // also below the multiple properties available
  myValidation.addValidator({
    elmName: 'input1',
    // friendlyName: $translate.instant('FIRST_NAME'),
    debounce: 1000,
    scope: $scope,
    rules: 'alpha|min_len:2|remote:customRemoteValidationCall()|required'
  });

  // you can also chain validation service and add multiple validators at once
  // we optionally start by defining some global options. Note: each validator can overwrite individually these properties (ex.: validatorX can have a `debounce` different than the global set)
  // there is 2 ways to write a call... #1-2 with elementName & rules defined as 2 or 3 strings arguments ... #3 with 1 object as argument (with defined property names)
  //    #1 .addValidtor('myElementName', 'myRules')
  //    #2 .addValidtor('myElementName', 'myRules', 'myFriendlyName')
  //    #3 .addValidator({ elmName: 'inputX', rules: 'myRules'})
  // the available object properties are the exact same set as the directive except that they are camelCase
  myValidation
    .setGlobalOptions({ debounce: 1500, scope: $scope, isolatedScope: $scope, preValidateFormElements: false, displayOnlyLastErrorMsg: false })
    .addValidator({ elmName: 'input2', debounce: 3000, rules: 'numeric_signed|required'})
    .addValidator('input3', 'float_signed|between_num:-0.6,99.5|required')
    .addValidator('input4', 'exact_len:4|pattern=/^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$/:alt=' + $translate.instant('INVALID_PATTERN_DATA', { data: 'YYWW' }) + '|required|integer')
    .addValidator('input5', 'email|required|min_len:6', $translate.instant('INPUT5')) // 3rd argument being the Friendly name
    .addValidator('input6', 'url|required')
    .addValidator('input7', 'ipv4|required')
    .addValidator('input8', 'credit_card|required', $translate.instant('INPUT8')) // 3rd argument being the Friendly name
    .addValidator('input9', 'between_len:2,6|required')
    .addValidator('input10', 'date_iso|required')
    .addValidator('input11', 'date_us_long|required')
    .addValidator('input12', 'time')
    .addValidator('select1', 'alpha|required:alt=' + $translate.instant('CHANGE_LANGUAGE'))
    .addValidator({elmName: 'input13', rules: 'min_len:5|max_len:10|alpha_dash_spaces|required', validationErrorTo: ".validation-input13"})
    .addValidator('input14', 'alpha|required')
    .addValidator('input15', 'alpha|min_len:3|required')
    .addValidator('input16', 'match:input15,Password|required')
    .addValidator('input17', 'different:input15,Password|required')
    .addValidator({elmName: 'input18', rules: 'alpha_spaces|exact_len:3|required', debounce: 3000})
    .addValidator('input19', 'date_iso_min:2001-01-01|required')
    .addValidator('input20', 'date_us_short_between:11/28/99,12/31/15|required')
    .addValidator('input21', 'in_list:banana,orange,ice cream,sweet & sour|required')
    .addValidator('area1', 'alpha_dash_spaces|min_len:15|required')
    .addValidator('input22', 'alpha_dash|min_len:2|required');

  // remove a single element ($scope.form1, string)
  // OR you can also remove multiple elements through an array type .removeValidator($scope.form1, ['input2','input3'])
  $scope.removeInputValidator = function ( elmName ) {
    myValidation.removeValidator($scope.form1, elmName);
  };
  $scope.resetForm = function() {
    myValidation.resetForm($scope.form1);
  };
  $scope.showValidationSummary = function () {
    $scope.displayValidationSummary = true;
  }

  $scope.submitForm = function() {
    if(myValidation.checkFormValidity($scope.form1)) {
      alert('All good, proceed with submit...');
    }
  }
  $scope.customRemoteValidationCall = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      var isValid = ($scope.input1 === "abc") ? true : false;
      deferred.resolve({ isValid: isValid, message: 'Returned error from promise.'});
    }, 1000);

    return deferred.promise;
  }
}]);

// -- Controller to use Angular-Validation with Directive and ngRepeat
// ---------------------------------------------------------------
myApp.controller('CtrlNgRepeat', ['$scope', 'ValidationService', function ($scope, ValidationService) {
  // Form data
  $scope.people = [
    { name: 'John', age: 20 },
    { name: 'Jane', age: null },
    { name: null, age: null }
  ];

  $scope.submitForm = function() {
    if(new ValidationService().checkFormValidity($scope.form01)) {
      alert('All good, proceed with submit...');
    }
  }
  $scope.showValidationSummary = function () {
    $scope.displayValidationSummary = true;
  }
}]);