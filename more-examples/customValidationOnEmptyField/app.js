'use strict';

var myApp = angular.module('emptyCustomValidation', ['ghiscoding.validation', 'pascalprecht.translate',
  'emptyCustomValidation.controllers']);
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


myApp.run(function ($rootScope) {
    $rootScope.$validationOptions = { debounce: 0 };
});

angular.module('emptyCustomValidation.controllers', []).
controller('myController', function($scope, ValidationService) {
    $scope.existingEmployees = [
      {
        firstName: 'John',
        lastName: 'Doe',
        id: 1
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        id: 2
      }];
    $scope.newEmployees = [
      {firstName : '', lastName: '', id : -1},
      {firstName : '', lastName: '', id : -2},
      {firstName : '', lastName: '', id : -3},
      {firstName : '', lastName: '', id : -4},
      {firstName : '', lastName: '', id : -5}
    ];

    $scope.submit = function() {
       if (!new ValidationService().checkFormValidity($scope.inputForm)) {
          var msg = '';
          $scope.inputForm.$validationSummary.forEach(function (validationItem) {
            msg += validationItem.message + '\n';
          });
          alert(msg);
          return;
      }
      alert('Data saved successfully.');
    };

    function employeeHasData(employee)
    {
      if ((!employee.firstName || employee.firstName === '') && (!employee.lastName || employee.lastName === ''))
        return false;
      return true;
    }
    $scope.newEmployeeFirstNameValidation = function(employee) {
      //alert('First name validation');
      var isValid = true;
      var msg = '';
      if (employeeHasData(employee) && !employee.firstName)
      {
        isValid = false;
        msg = 'First name required';
      }

      // The next 4 lines are only here to show that custom validation works if text is given
      if (isValid && employee.firstName && employee.firstName.length > 10)
      {
        isValid = false;
        msg = 'Max number of characters for first name: 10'
      }

      return { isValid: isValid, message: msg };
    };

    $scope.newEmployeeLastNameValidation = function(employee) {
      var isValid = true;
      var msg = '';
      if (employeeHasData(employee) && !employee.lastName)
      {
        isValid = false;
        msg = 'Last name required';
      }

      // The next 4 lines are only here to show that custom validation works if text is given
      if (isValid && employee.lastName && employee.lastName.length > 8)
      {
        isValid = false;
        msg = 'Max number of characters for last name: 8'
      }
      return { isValid: isValid, message: msg };
    };
});