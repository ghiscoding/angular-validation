#Angular Validation
`Version: 1.0 Beta` 

Angular Validation made easy! Angular Validation is an angular directive with locales (languages) with a simple approach of defining your validation in 1 line and displaying the errors on another 1 line...that's it! 

The concept is not new, it comes from the easy form input validation approach of Laravel Framework and also from PHP Gump Validation. They both are built in PHP but why not use the same concept over Angular as well? Well now it is available and with some extras.

##  Some Working Examples

Let's start with a simple example and then let's get down to real business.

P.S. For real live example, please download the Github project and run the `index.html` (no server needer) while the actual form with validation is inside `templates/testingForm.html`
<a name="examples"></a>
```html
<!-- example 1 -->
<label for="input1">Simple Integer</label>
<input type="text" name="input1" ng-model="form1.input1" ngx-validation="integer|required" />
<span class="validation text-danger">{{ validation_errors["input1"] }}</span>

<!-- example 2 -->
<label for="input2">email + min(3) + max(10) + required</label>
<input type="text" name="input2" ng-model="form1.input2" ngx-validation="email|min_len:3|max_len:10|required" />
<span class="validation text-danger">{{ validation_errors["input2"] }}</span>

<!-- example 3 - with Regular Expression (Date Code of YYWW) -->
<label for="input3">Multiple Validations + Custom Regex of Date Code (YYWW)</label>
<input type="text" name="input3" ng-model="form1.input3" 
		ngx-validation="exact_len:4|regex:YYWW:=^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$:regex|required|integer" />
<span class="validation text-danger">{{ validation_errors["input3"] }}</span>
```
<a name="regex"></a>
Regular Expressions (Regex)
--------------------
From the example displayed, I introduce the custom regular expression, there is no limitation on regex itself and you can even use the pipe " | " without being scared of interfering with the other validation filters BUT you have to follow a specific pattern (a writing patter that is), and if you don't, well it will fail. Let's explain how it works... 

Regex validation filter is divided in 4 specific parts (Step #1-4). 

Let's use the previous [Examples](#examples) #3 and extract the information out of it to see how it works. 
Step #1-4 are for explanation only, while step #5 is the full validator and make sure there is no spaces.

1. Start and End the filter with the following `regex: :regex`

2. Custom error message `YYWW`

3. Followed by a separator which basically says, after this will come the regex `:=`

4. Custom regex pattern `^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$`

5. Final code (no spaces): `regex:YYWW:=^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$:regex`


Locales (languages)
--------------------
Locales are simply sets of language defined in external JSON files, we can easily add any new language as extra files without affecting the behaviour of the angular directive. You could even change displayed language on the fly, well of course the error message will be reflected only after field value is re-evaluated. You of course have to include the `angular-translate` library and configure it, see [Include it in your Project](#project)
```javascript
// define a key, could be on the fly with a button or a menu link
var key = 'fr'; 

$scope.switchLanguage = function (key) {
  $translate.uses(key);
};
```	  

Available Validators
--------------------
* `alpha` Ensure only alpha characters are present in the key value (a-z, A-Z)
* `alpha_num` Ensure only alpha-numeric characters are present in the key value (a-z, A-Z, 0-9)
* `alpha_dash` Ensure only alpha-numeric characters + dashes and underscores are present in the key value (a-z, A-Z, 0-9, _-)
* `between_len:min,max` Ensures the length of a string is between a min,max string length.
* `credit_card` Check for valid credit card number (AMEX, VISA, Mastercard, Diner's Club, Discover, JCB)
* `date_iso` Ensure date follows the ISO format (yyyy-mm-dd)
* `date_us_long` Ensure date follows the US long format (mm-dd-yyyy) or (mm/dd/yyyy)
* `date_us_short` Ensure date follows the US short format (mm-dd-yy) or (mm/dd/yy)
* `date_euro_long` Ensure date follows the Europe long format (dd-mm-yyyy) or (dd/mm/yyyy)
* `date_euro_short` Ensure date follows the Europe short format (dd-mm-yy) or (dd/mm/yy)
* `email` Checks for a valid email address
* `exact_len:n` Ensures that field length precisely matches the specified length. n = length parameter.
* `iban` Check for a valid IBAN
* `integer` Ensure only integer key values
* `max_len,n` Checks field length, makes sure it's not longer than specified length. n = length parameter.
* `min_len,n` Checks field length, makes sure it's not shorter than specified length. n = length parameter.
* `numeric` Ensure only numeric key values
* `regex` Ensure it follows a regular expression pattern... please see [Regex](#regex)
* `required` Ensures the specified key value exists and is not empty
* `url` Check for valid URL or subdomain

<a name="project"></a>
Include it in your app project:
--------------------
```javascript
// include it your app module ( we need both Translate & Validation)
var myApp = angular.module('myApp', ['ngRoute', 'pascalprecht.translate', 'ghiscoding.validation']);

// include validation locales
myApp.config(function ($translateProvider) {
  $translateProvider.useStaticFilesLoader({
    prefix: 'locales/validation/',
    suffix: '.json'
  });

  // load English ('en') table on startup
  $translateProvider.preferredLanguage('en');
});

// inside Controller define a scope variable to hold the error displayed so we can bind them to the form
// $scope.validation_errors = [];
myApp.controller('Ctrl', ['$scope', '$translate', function ($scope, $translate) {
  $scope.myForm = {};
  $scope.validation_errors = []; // required scope variable
}]);
```

Dependencies:
------------------

1. Angular-Translate (https://github.com/PascalPrecht/angular-translate)
2. Bootstrap 3 *optional* (http://getbootstrap.com/)

# TODO 
#### Any kind of help is welcome from the TODO list

* Add `same` and `different` validators (same password)
* Add `ipv4` and `ipv6` validators
* Add `street_address` validator
* Add more validators...
* Add more locale languages
* Add option to use it with onblur or onkeyup 
* Add online demo