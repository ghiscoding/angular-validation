'use strict';

var app = angular.module('plunker', ['ui.bootstrap','ghiscoding.validation', 'pascalprecht.translate']);

app.config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: '../../locales/validation/',
      suffix: '.json'
    });

    // load English ('en') table on startup
    $translateProvider.preferredLanguage('en');
  }])
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }]);

app.directive('formField',function() {
  return {
    restrict:'E',
    templateUrl:"template.html"
  }
});

app.controller('MainCtrl', function($scope,ValidationService) {
  $scope.name = 'World';
  $scope.items={};
  $scope.items.item1 = {
    heading:"Item1",
    formName:"Form1"
  };
  $scope.items.item1.fields = [
   {
      name: 'firstName',
      label:'Enter First Name',
      validation:"required"
    },
    {
      name: 'lastName',
      label: 'Enter Last Name',
      validation:"required"
    }
  ];
  $scope.items.item2 = {
    heading:"Item2",
    formName:"Form2"
  };
  $scope.items.item2.fields = [
   {
      name: 'email',
      label:'Enter Email Id',
      validation:"required"
    },
    {
      name: 'phoneNo',
      label: 'Enter Phone Number',
      validation:"required"
    }
  ];

  // redefine which scope to use inside the Angular-Validation
  $scope.$validationOptions = { isolatedScope: $scope };

  $scope.validate = function() {
    for(var key in $scope.items) {
      var formName=$scope.items[key].formName;

      if(new ValidationService().checkFormValidity($scope[formName])) {
        $scope[formName].isValid = true;
      }
      else {
        $scope[formName].isValid = false;
      }
    }
  };
});