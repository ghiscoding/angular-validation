'use strict';

var myApp = angular.module('myApp', ['ghiscoding.validation', 'pascalprecht.translate', 'ngTagsInput', 'angularjs-dropdown-multiselect',
    'hljs', 'isteven-multi-select']);

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
	}]);

myApp.controller('Ctrl', ['ValidationService', function (ValidationService) {
  var vm = this;
  var myValidation = new ValidationService({ controllerAs: vm, formName: 'vm.test', preValidateFormElements: false });

  vm.tags1 = [
    { id: 1, text: 'Tag1' },
    { id: 2, text: 'Tag2' },
    { id: 3, text: 'Tag3' }
  ];
  vm.tags2 = [
    { id: 1, text: 'Tag7' },
    { id: 2, text: 'Tag8' },
    { id: 3, text: 'abc' }
  ];

  vm.select1model = [];
  vm.select1data = [
    {id: 1, label: "Joe"},
    {id: 2, label: "John"},
    {id: 3, label: "Jane"}
  ];

  vm.modernBrowsers = [
    { name: "Opera",  maker: "Opera Software",  ticked: true, icon: "<img src='https://cdn1.iconfinder.com/data/icons/fatcow/32/opera.png' />"  },
    { name: "Internet Explorer",  maker: "Microsoft", ticked: false, icon: "<img src='https://cdn1.iconfinder.com/data/icons/fatcow/32/internet_explorer.png' />" },
    { name: "Firefox",  maker: "Mozilla Foundation",  ticked: false, icon: "<img src='https://cdn1.iconfinder.com/data/icons/humano2/32x32/apps/firefox-icon.png' />"  },
    { name: "Safari", maker: "Apple", ticked: false, icon: "<img src='https://cdn1.iconfinder.com/data/icons/fatcow/32x32/safari_browser.png' />" },
    { name: "Chrome", maker: "Google",  ticked: false, icon: "<img src='https://cdn1.iconfinder.com/data/icons/google_jfk_icons_by_carlosjj/32/chrome.png' />"  }
  ];

  // declare public functions
  vm.submit = submit;

  return vm;

  function submit() {
    if(new ValidationService().checkFormValidity(vm.test)) {
      alert('valid');
    }
  }
}]);
