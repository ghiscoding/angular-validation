var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate']);

myApp.config(['$compileProvider', function($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
}]);
myApp.config(['$translateProvider', function ($translateProvider) {
	  $translateProvider.useStaticFilesLoader({
      prefix: '../../locales/validation/',
      suffix: '.json'
    });

  	// load English ('en') table on startup
		$translateProvider.preferredLanguage('en').fallbackLanguage('en');
	}]);

myApp.controller('Ctrl', ['$scope', 'ValidationService',
  function($scope, ValidationService) {

    var validate = new ValidationService({ debounce: 100, isolatedScope: $scope});

    $scope.ModelData = {};
    $scope.ModelData.IsShowNote = false;
    $scope.ModelData.Count = '';

    $scope.ModelData.SaveFunctionClick = function() {
      if (validate.checkFormValidity($scope.f1)) {
        $scope.ModelData.Count = 'Form OK';
      }else {
        $scope.ModelData.Count = $scope.f1.$validationSummary.length;
        return;
      }
    }
  }
]);