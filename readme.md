#Angular Validation (Directive and Service)
### Form validation after user inactivity (customizable timeout)
`Version: 1.3.7` 

Angular Validation made easy! Angular Validation is an angular directive with locales (languages) with a simple approach of defining your `validation=""` directly within your element to validate (input, textarea, etc) and...that's it!!! The directive will take care of the rest!

The base concept is not new, it comes from the easy form input validation approach of Laravel Framework as well as PHP Gump Validation. They both are built in PHP and use a very simple approach, so why not use the same concept over Angular as well? Well now it is available and with some extras.

For a smoother user experience, I also added validation on inactivity (timer). So validation will not bother the user while he is still typing... but as soon as the user makes a pause for a certain amount of time, then validation comes into play. This feature is only while typing, if user is focusing out of the input (onBlur) it will validate instantly.

Now also supporting AngularJS 1.3.x 
*current code should work with 1.2.x just the same but is no more verified*

Now support <b>Service</b> using the same functionality as the Directive.
Huge rewrite of the code to better separate the code and also adding support to Service functionality. Specifically the `validation-rules` to add rules without affecting the core and `validation-common` for shared functions (shared by Directive/Service).

## Live Demo
[Plunker](http://plnkr.co/jADq7H)
<a name="live_demo"></a>

## Requirements
Angular-Validation requires the element that will use validation to have a `name=""` attribute, so that it can use this name to associate a `<span>` for error displaying. For example: `<input name="input1" ng-model="input1" validation="validator1" />`. 

*The necessity of `name=""` attribute is new since version 1.3.4+, prior to this change we were asking the user to create his own `<span>` for error displaying. For a better understanding, the `<span>` is now optional, but the `name=""` attribute becomes mandatory and will throw an error if omitted*


## Some Working Examples (Directive)
Let's start with a simple example and then let's get down to real business.

P.S. For real live sample, see the [live demo](#live_demo) or download the Github project and run the `index.html` (on the exception of Chrome who doesn't want to run http outside of webserver) while the actual form with validation is inside `templates/testingFormDirective.html` for a better separation.
<a name="examples"></a>
```html
<!-- example 1 -->
<!-- change the debounce or typing-limit (timer in ms of inactivity) after which will trigger the validation check -->
<label for="input1">Simple Integer -- debounce(5sec)</label>
<input type="text" name="input1" ng-model="form1.input1" debounce="5000" validation="integer|required" />

<!-- example 2 -->
<label for="input2">email + min(3) + max(10) + required</label>
<input type="text" name="input2" ng-model="form1.input2" validation="email|min_len:3|max_len:10|required"  />

<!-- example 3 -->
<!-- between_num could also be written with 2 conditions of min_num:n|max_num:n ... same goes to between_len -->
<label for="input3">Float only + between(min,max) + required</label>
<input type="number" name="input3" ng-model="form1.input3" validation="numeric|between_num:6,99.9|required"  />

<!-- example 4 -->
<!-- input match confirmation (ex.: password confirmation) -->
<!-- match validator can use 1 or 2 params (match:field1 ..OR.. match:field1,Text to Display) -->
<!-- when using 2 params (separated by comma ',') then 2nd param is used as text to display -->
<label for="input4">Password</label>
<input type="password" name="input4" ng-model="form1.input4" validation="alpha|min_len:4|required"  />
<label for="input4c">Password Confirmation</label>
<input type="password" name="input4c" ng-model="form1.input4c" validation="match:form1.input4,Password not match|required"  />

<!-- example 5 - with Regular Expression (Date Code of YYWW) -->
<label for="input5">Multiple Validations + Custom Regex of Date Code (YYWW)</label>
<input type="text" name="input5" ng-model="form1.input5" 
		validation="exact_len:4|regex:YYWW:=^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$:regex|required|integer"  />

<!-- example 6 - required select option (dropdown) -->
<div class="form-group">
    <label for="select1">Select Option Required</label>           
    <select id="stk_type" name="stk_type" class="form-control" ng-model="form1.select1" validation="required">
        <option value="">...</option>   
        <option value="1">Option #1</option>
        <option value="2">Option #2</option>
    </select>
</div>

<!-- EXPLANATIONS -->
<!-- <input> need the <validation=""> each validators are separated by a pipe | -->
<input validation="validator1|validator2|..." />

<!-- Example -->
<input type="text" name="input1" />
<!-- The directive will create by itself the following element, with a className of "validation-inputName" to display the error -->
<!-- You could easily apply styling as you see fit, using the className of "validation" and/or "validation text-danger" -->
<span class="validation-input1 validation text-danger">error message here</span>

<!-- EXCEPTIONS: We could also use our own custom <span> or <div> element when needed, for example input groups wrapper, see next step -->
```

## Service Working Examples (Service)
P.S. For real live sample, see the [live demo](#live_demo) or download the Github project and run the `index.html` (on the exception of Chrome who doesn't want to run http outside of webserver) while the actual form with validation is inside `templates/testingFormService.html` for a better separation.
<a name="examples-service"></a>
```javascript
  // start by creating the service
  var myValidation = new validationService();

  // you can create indepent call to the validation service  
  myValidation.addValidator({
    elmName: 'input2',
    debounce: 3000,
    scope: $scope,
    rules: 'numeric_signed|required'
  });

  // you can also chain validation service and add multiple validators at once
  // we optionally start by defining some global options. Note: each validator can overwrite individually these properties (ex.: validatorX can have a `debounce` different than the global set)
  // there is 2 ways to write a call... #1 with elementName & rules defined as 2 strings arguments ... #2 with 1 object as argument (with defined property names)
  //    #1 .addValidtor('myElementName', 'myRules') ... #2 .addValidator({ elmName: 'inputX', rules: 'myRules'})
  // the available object properties are the exact same set as the directive except that they are camelCase
  myValidation
    .setGlobalOptions({ debounce: 1500, scope: $scope }) 
    .addValidator('input3', 'float_signed|between_num:-0.6,99.5|required')
    .addValidator('input4', 'exact_len:4|regex:YYWW:=^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$:regex|required|integer')
    .addValidator('input5', 'email|required|min_len:6');

  // you can also remove a Validator with an ngClick or whichever way you prefer by calling .removeValidator()
  $scope.removeInputValidator = function ( elmName ) {
    // remove a single element (string) OR you can also remove multiple elements through an array type .removeValidator(['input2','input3'])
    myValidation.removeValidator(elmName); 
  };

```

Bootstrap Input Groups Wrapping - Exceptions HOWTO
--------------------
Well let's face it, having the `<span>` for error display right after the element to be validated is not always ideal and I encounter the problem myself when using Bootstrap on inputs with `input-group`, it had so much wrapping around the input that the next available element might not be the one we want. In these special occasions, we will add a `<span>` or a `<div>` for displaying the possible error and give the this element an `id="someId"` or a `class="className"` and then reference it inside our input. We could actually move the error element anywhere we want with this method, just don't forget to name it with an `id` or a `className` and call the `validation-error-to` attribute. This attribute could be called in 3 different ways: with '.' (element error className) or with/without '#' (element error id) We could even do a validation summary with this...just saying hehe.
```html
<div class="form-group" ng-hide="trsn.isDividend">
    <label for="input1">Search Input with BS input-groups</label>
    <div class="input-group">
        <span class="input-group-addon">@</span>
        <input type="text" class="form-control" name="input1" ng-model="form1.input1" 
          validation="min_len:2|max_len:10|alpha_dash_spaces|required" 
          validation-error-to="myErrorId" />
        <span class="input-group-addon"><span class="glyphicon glyphicon-search"></span></span>
    </div>
    <span id="myErrorId" class="validation text-danger"></span>
</div>

<!-- 3 ways of writting it, 2 ways for ID, 1 way for className -->
<!-- with an ID -->
<input name="input1" validation="validator1" validation-error-to="myErrorId" />
<input name="input1" validation="validator1" validation-error-to="#myErrorId" />
<span id="myErrorId" class="validation text-danger"></span>

<!-- or with a className -->
<input name="input1" validation="validator1" validation-error-to=".errorClassName" />
<span class="errorClassName validation text-danger"></span>

<!-- or even better, since this directive use a pattern of className named as "validation-yourInputName" -->
<!-- you could create only the `<span>` and ommit/skip the `validation-error-to=""` attribute within the input -->
<input name="input1" validation="validator1" />
<span class="validation-input1 validation text-danger"></span>
```

<a name="regex"></a>
Regular Expressions (Regex)
--------------------
From the example displayed, I introduce the custom regular expression, there is no limitation on regex itself and you can even use the pipe " | " within it and without being scared of interfering with the other validation filters BUT you have to follow a specific pattern (a writing pattern that is), and if you don't, well it will fail. Let's explain how it works... 

Regex validation is divided in 4 specific parts (Step #1-4). 

Let's use the previous [Examples](#examples) #5 and extract the information out of it to see how it works. 
Step #1-4 are for explanation only, at the end we show the full regex (make sure there is no spaces).

1. Start and End the filter with the following `regex: :regex` which tells the directive where to extract it.

2. Custom error message `YYWW` (what do we want to display to the user)

3. Followed by a separator which basically says... after `:=` separator comes the regex pattern

4. Custom regex pattern `^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$`

Final code (without spaces): `regex:YYWW:=^(0[9]|1[0-9]|2[0-9]|3[0-9])(5[0-2]|[0-4][0-9])$:regex`


Locales (languages)
--------------------
Locales are simply sets of language defined in external JSON files, we can easily add any new language as extra files without affecting the behaviour of the angular directive. You could even change displayed language on the fly, well of course the error message will be reflected only after field value is re-evaluated. You of course have to include the `angular-translate` library and configure it, see section [Include it in your Project](#project)

Note: To be fully localized, I should add the country code at the end of my JSON filename and then change the suffix on the `angular-translate` `loader` method, but then this would add an overhead and I prefer to keep it simple as validation messages often looks the same anyway. If you do want to be fully localized, then see the example in [Include it in your Project](#project)

```javascript
// define a key, could be on the fly with a button or a menu link
var key = 'fr'; 

$scope.switchLanguage = function (key) {
  $translate.use(key);
};
```	  

P.S. If you define a new Language set, please make a pull request and I would be happy to add them in current project... It would be nice to have Spanish, German or even Chinese :) Thank you.

Available Validators
--------------------
All validators are written as `snake_case` but it's up to the user's taste and could also be written as `camelCase`. So for example `alpha_dash_spaces` and `alphaDashSpaces` are both equivalent.
##### NOTE: on an input type="number", the "+" sign is an invalid character (browser limitation) even if you are using a `signed` validator. If you really wish to use the "+", then change your input to type="text".
* `alpha` Only alpha characters (including latin) are present (a-z, A-Z)
* `alpha_spaces` Only alpha characters (including latin) and spaces are present (a-z, A-Z)
* `alpha_num` Only alpha-numeric characters (including latin) are present (a-z, A-Z, 0-9)
* `alpha_num_spaces` Only alpha-numeric characters (with latin & spaces) are present (a-z, A-Z, 0-9)
* `alpha_dash` Only alpha-numeric characters + dashes, underscores are present (a-z, A-Z, 0-9, _-)
* `alpha_dash_spaces` Alpha-numeric chars + dashes, underscores and spaces (a-z, A-Z, 0-9, _-)
* `between_len:min,max` Ensures the length of a string is between a min,max length.
* `between_num:min,max` Ensures the numeric value is between a min,max number.
* `credit_card` Check for valid credit card number (AMEX, VISA, Mastercard, Diner's Club, Discover, JCB)
* `date_iso` Ensure date follows the ISO format (yyyy-mm-dd)
* `date_us_long` Ensure date follows the US long format (mm-dd-yyyy) or (mm/dd/yyyy)
* `date_us_short` Ensure date follows the US short format (mm-dd-yy) or (mm/dd/yy)
* `date_euro_long` Ensure date follows the Europe long format (dd-mm-yyyy) or (dd/mm/yyyy)
* `date_euro_short` Ensure date follows the Europe short format (dd-mm-yy) or (dd/mm/yy)
* `email` Checks for a valid email address
* `exact_len:n` Ensures that field length precisely matches the specified length (n).
* `float` Only a positive floating point value (integer are excluded)
* `float_signed` Only a floating point value (integer excluded), could be signed (-/+) positive/negative.
* `iban` Check for a valid IBAN.
* `int` Only positive integer (alias to `integer`).
* `integer` Only positive integer.
* `int_signed` Only integer, could be signed (-/+) positive/negative (alias to `integer_signed`).
* `integer_signed` Only integer, could be signed (-/+) positive/negative.
* `ipv4` Check for valid IP (IPv4)
* `ipv6` Check for valid IP (IPv6)
* `ipv6_hex` Check for valid IP (IPv6 Hexadecimal)
* `match:n` Match another input field(n), where (n) must be the exact ngModel attribute of input field to compare to.
* `match:n,t` Match another input field(n), same as (match:n) but also include (t) for alternative text to be displayed.
* `max_len:n` Checks field length, no longer than specified length where (n) is length parameter.
* `max_num:n` Checks numeric value to be lower or equal than the number (n).
* `min_len:n` Checks field length, no shorter than specified length where (n) is length parameter.
* `min_num:n` Checks numeric value to be higher or equal than the number (n).
* `numeric` Only positive numeric value (float, integer).
* `numeric_signed` Only numeric value (float, integer) can also be signed (-/+).
* `regex` Ensure it follows a regular expression pattern... please see [Regex](#regex) section
* `required` Ensures the specified key value exists and is not empty
* `url` Check for valid URL or subdomain
* `time` Ensure time follows the format of (hh:mm) or (hh:mm:ss)

<a name="project"></a>
Include it in your app project:
--------------------
```javascript
// include it your app module ( we need both Translate & Validation)
var myApp = angular.module('myApp', ['ngRoute', 'ghiscoding.validation', 'pascalprecht.translate']);

// include validation languages
// if you want full localization add it in the suffix
// For example on Canadian French/English, we could replace the code by `suffix: '-CA.json'`
myApp.config(function ($translateProvider) {
  $translateProvider.useStaticFilesLoader({
    prefix: 'locales/validation/',
    suffix: '.json'
  });

  // load English ('en') table on startup
  $translateProvider.preferredLanguage('en');
});
```

Dependencies:
------------------

1. Angular-Translate (https://github.com/PascalPrecht/angular-translate)
2. Bootstrap 3.x *is optional* (http://getbootstrap.com/)
3. AngularJS 1.2.x / 1.3.x (https://angularjs.org/)

License
-----
[MIT License](http://www.opensource.org/licenses/mit-license.php)  

# TODO 
#### Any kind of help is welcome from the TODO list
* Add more validators...
* Add more locale languages... I need your help on that one!!!

## CHANGELOG
* [1.3.0](https://github.com/ghiscoding/angular-validation/commit/d106996926bef86a0457c90fbb65fe6233f3928d) `2014-12-01` Added support to AngularJS 1.3
* [1.3.1](https://github.com/ghiscoding/angular-validation/commit/44fe9de050504a46bb0eb975c31bc4b0f3b6f516) `2015-01-02` Added Input Match/Confirmation Validator, ex: password confirmation.
* [1.3.2](https://github.com/ghiscoding/angular-validation/commit/41f9ed9abc7a6d66d4ecf6418b810459bf1d8717) `2015-01-03` Float number validator to also permit dot (.) as first character. Also removed keyboard blocking of invalid character on input type="number" now displays error message.
* [1.3.3](https://github.com/ghiscoding/angular-validation/commit/7b3043a97006a3d7043b198f89c91f8b6c49476e) `2015-01-04` Added changelog & updated Bootstrap(3.3.1), AngularJS(1.3.7) to latest versions
* [1.3.4](https://github.com/ghiscoding/angular-validation/commit/ba30d55ddb8bca44a8032fc8253356450bd4e1d4) `2015-01-06` Removed the necessity of creating a `<span>` for displaying the error message, the directive now handles it by itself.
* [1.3.5](https://github.com/ghiscoding/angular-validation/commit/679b24ca4daee8419731c45d1d65d63cb5ca74a5) `2015-01-26` Throw an error message when user did not provide a `name=""` property inside the element to validate.
* [1.3.6](https://github.com/ghiscoding/angular-validation/commit/e47e91f45f93a3f191ab6849d06163563674e9e2) `2015-02-09` Added `ng-strict-di` for minification, renamed some files and folder lib to `/vendors`, moved directive into new `/src` folder for better separation. 
* [1.3.7](https://github.com/ghiscoding/angular-validation/commit/86c16f720d6687d3b5ca93e49a0a37824027e583) `2015-03-08` Complete rewrite (but same functionality) so that I could add an Angular-Validation Service which is similar implementation as the Directive. Also added `debounce` attribute which is an alias to `typingLimit`, validation rules are now defined as an external service for better maintainability and easily be used by both Validation Directive and Service, also created a common file for shared functions.