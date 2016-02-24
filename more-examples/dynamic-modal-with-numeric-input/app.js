'use strict';

var app = angular.module('myApp', ['ngSanitize', 'ghiscoding.validation', 'pascalprecht.translate', 'ui.bootstrap']);

app.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }])
	.config(['$translateProvider', function ($translateProvider) {
	  $translateProvider.useStaticFilesLoader({
      prefix: '../../locales/validation/',
      suffix: '.json'
    });
  	// load English ('en') table on startup
	$translateProvider.preferredLanguage('en').fallbackLanguage('en');
    $translateProvider.useSanitizeValueStrategy('sanitize');
	}]);

app.directive("dynamicName", function ($compile) {
    "use strict";

    return {
        restrict: "A",
        terminal: true,
        priority: 1000,
        link: function (scope, element, attrs) {
            element.attr('name', scope.$eval(attrs.dynamicName));
            element.removeAttr("dynamic-name");
            $compile(element)(scope);
        }
    };
});

app.controller('ListController',['$scope', function($scope) {
  $scope.items = [{"id": 1},{"id": 2}];
}]);

app.controller('ModalController', ['$scope', '$modal', 'ValidationService', function ($scope, $modal, ValidationService) {
    "use strict";

    var myValidation = new ValidationService({ formName: 'itemsEdit' });

    $scope.animationsEnabled = true;

    $scope.open = function (size) {

        var modalInstance = $modal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'myModalContent.html',
            backdrop: 'static',
            controller: 'ModalInstanceController',
            size: size,
            scope: $scope
        });
    };
}]);

app.controller('ModalInstanceController', ['$scope', '$modalInstance', '$log', function ($scope, $modalInstance, $log) {
    "use strict";
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);