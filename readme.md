#Angular Validation
`Version: 1.0 Beta` 

Angular Validation made easy! Angular Validation is an angular directive with locales (languages) with a simple approach of defining your validation in 1 line and displaying the errors on another 1 line...that's it! 

The concept is not new, it comes from the easy input validation approach of Laravel Framework and also from PHP Gump Validation. They both are built in PHP but why not use the same concept over Angular as well? Well now it is and even with some extra.

##  Some Working Examples

Let's start with a simple example and then let's get down to real business

```html
<!-- example 1 -->
<label for="input1">Simle Integer</label>
<input type="text" class="form-control" name="input1" placeholder="validate integer" ng-model="form1.input1" ngx-validation="integer|required" />
<span class="validation text-danger">{{ validation_errors["input1"] }}</span>

<!-- example 2 -->
<label for="input2">Alphanumeric + Exact(3) + required</label>
<input type="text" class="form-control" name="input2" placeholder="validate alphanumeric(3)" ng-model="form1.input2" ngx-validation="alpha|exact_len:3|required" />
<span class="validation text-danger">{{ validation_errors["input2"] }}</span>

<!-- example 3 - with Regular Expression (Date Code of YYWW) -->
<label for="input3">Multiple Validations + Custom Regex of Date Code (YYWW)</label>
<input type="text" class="form-control" name="input3" placeholder="validate decimal" ng-model="form1.input3" ngx-validation="exact_len:4|regex:YYWW:=^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$:regex|required|integer" />
<span class="validation text-danger">{{ validation_errors["input3"] }}</span>
```

Regular Expressions (Regex)
--------------------
From the example displayed, I introduce the custom Regex, there is no limitation on how to write them and you can even use the pipe (|) without any problems BUT you have to follow the exact way of writing them, if you don't it will fail. So the Regex is divided in 4 specific parts. Let's use the previous example and extract the information out of it.

1. start and end the filter with the following   
`regex: :regex`

2. custom error message to be displayed, what error format will you display to the user
`YYWW`

3. followed by a separator which basically says, after this will come the regex
`:=`

4. finally the custom regex pattern
`^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$`

5. Let's put it all together again:
`regex:YYWW:=^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$:regex`

Available Validators
--------------------
* alpha `Ensure only alpha characters are present in the key value (a-z, A-Z)`
* alpha_num `Ensure only alpha-numeric characters are present in the key value (a-z, A-Z, 0-9)`
* alpha_dash `Ensure only alpha-numeric characters + dashes and underscores are present in the key value (a-z, A-Z, 0-9, _-)`
* between:min,max `Ensures the length of a string is between a min,max amount of characters. min = minimum length, max = maximum length.`
* credit_card `Check for a valid credit card number (Uses the MOD10 Checksum Algorithm)`
* date_iso `Ensure date follows the ISO format (yyyy-mm-dd)`
* date_us_long `Ensure date follows the US long format (mm-dd-yyyy) or (mm/dd/yyyy)`
* date_us_short `Ensure date follows the US short format (mm-dd-yy) or (mm/dd/yy)`
* date_euro_long `Ensure date follows the Europe long format (dd-mm-yyyy) or (dd/mm/yyyy)`
* date_euro_short `Ensure date follows the Europe short format (dd-mm-yy) or (dd/mm/yy)`
* email `Checks for a valid email address`
* exact_len:n `Ensures that the key value length precisely matches the specified length. n = length parameter.`
* integer `Ensure only integer key values`
* max_len,n `Checks key value length, makes sure it's not longer than the specified length. n = length parameter.`
* min_len,n `Checks key value length, makes sure it's not shorter than the specified length. n = length parameter.`
* numeric `Ensure only numeric key values`
* regex `Ensure it follows a regular expression pattern... Very special case, see the example on how use it properly`
* required `Ensures the specified key value exists and is not empty`
* url `Check for valid URL or subdomain`

Include it in your project:
```javascript
// include it your app module ( we need both Translate & Validation)
var myApp = angular.module('myApp', ['ngRoute', 'pascalprecht.translate', 'ghiscoding.validation']);

// include validation locales
.config(function ($translateProvider) {
  $translateProvider.useStaticFilesLoader({
    prefix: 'locales/validation/',
    suffix: '.json'
  });
// load 'en' table on startup
$translateProvider.preferredLanguage('en');
```

Dependencies (*optional):
------------------

1. Angular-Translate (https://github.com/PascalPrecht/angular-translate)
2. * Bootstrap 3 (http://getbootstrap.com/)