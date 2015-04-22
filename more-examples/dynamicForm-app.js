'use strict';

var app = angular.module('plunker', ['ui.bootstrap','ghiscoding.validation', 'pascalprecht.translate']);

app.config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: '../locales/validation/',
      suffix: '.json'
    });

    // load English ('en') table on startup
    $translateProvider.preferredLanguage('en');
  }]);

app.directive('formField',function(){
  return{
    restrict:'E',
    templateUrl:"dynamicFormView.html"
  }
});

app.controller('MainCtrl', function($scope,validationService) {
  $scope.name = 'World';
  $scope.items={};
  $scope.items.item1={
    heading:"Item1",
    formName:"Form1"
  };
  $scope.items.item1.fields=[
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
  $scope.items.item2={
    heading:"Item2",
    formName:"Form2"
  };
  $scope.items.item2.fields=[
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

 $scope.validate=function(){
    for(var key in $scope.items){
      var formName=$scope.items[key].formName;
      var form = angular.element(document.querySelector('[name="'+formName+'"]'));
      var childScope = form.scope();
      console.debug(childScope[formName]);
      if(new validationService().checkFormValidity(childScope[formName]))
        alert("form "+formName+" is valid");
      else
        alert("form "+formName+" is invalid");
    }
  };
});