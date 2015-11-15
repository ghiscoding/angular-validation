'use strict';

var myApp = angular.module('myApp', ['ngRoute', 'ngSanitize', 'ghiscoding.validation', 'pascalprecht.translate']);
myApp.config(['$compileProvider', '$locationProvider', '$routeProvider', function ($compileProvider, $locationProvider, $routeProvider) {
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



myApp.controller('ctrlDirective', [function () {
 var vmd = this;

 vmd.onChange = function(index) {
    vmd.formValid1 = vmd.form1.$valid;
    vmd.fullName1 = vmd.firstName1 + ' ' + vmd.lastName1;
    return index;
 }
}]);

myApp.controller('ctrlService', [function () {
 var vms = this;

 vms.onChange = function() {
    vms.formValid2 = vms.form2.$valid;
    vms.fullName2 = vms.firstName2 + ' ' + vms.lastName2;
 }
}]);