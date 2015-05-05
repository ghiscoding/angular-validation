#Angular Validation (Directive / Service)
`Version: 1.3.22`
### Form validation after user inactivity of default 1sec. (customizable timeout)

Forms Validation with Angular made easy! Angular-Validation is an angular directive/service with locales (languages) with a very simple approach of defining your `validation=""` directly within your element to validate (input, textarea, etc) and...that's it!!! The directive/service will take care of the rest!

The base concept is not new, it comes from the easy form input validation approach of Laravel Framework as well as PHP Gump Validation. They both are built in PHP and use a very simple approach, so why not use the same concept over Angular as well? Well now it is available with few more extras.

For a smoother user experience, I also added validation on inactivity (timer/debounce). So validation will not bother the user while he is still typing... though as soon as the user pauses for a certain amount of time, then validation comes into play. It's worth knowing that this inactivity timer is only available while typing, if user focuses away from his input (onBlur) it will then validate instantly.

Supporting AngularJS 1.3.x *(current code should work with 1.2.x just the same but is no more verified)*

Now support <b>Service</b> using the same functionalities as the <b>Directive</b>.
Huge rewrite to have a better code separation and also adding support to Service functionalities. Specifically the `validation-rules` was separated to add rules without affecting the core while `validation-common` is for shared functions (shared by Directive/Service).

[Validation Summary](/ghiscoding/angular-validation/wiki/Validation-Summary) was also recently added to easily show all validation errors that are still active on the form and you can also use 2 ways of dealing with the [Submit and Validation](/ghiscoding/angular-validation/wiki/Form-Submit-and-Validation) button.

For more reasons to use it, see the answered question of: [Why Use It?](#whyuseit)

If you do use it, please click on the Star and add it as a favourite. The more star ratings there is, the more chances it could found by other users as a populate trend. That is the only support I ask you... thanks ;)

<a name="plunker"></a>
## Live Demo
[Plunker](http://plnkr.co/jADq7H)

## Angular-Validation Wiki
All the documentation has been moved to the Wiki section, see the [github wiki](/ghiscoding/angular-validation/wiki) for more explanation.
**Wiki Contents**

* [Angular-Validation Wiki](/ghiscoding/angular-validation/wiki)
* Installation
    * [Bower/NuGet Packages](/ghiscoding/angular-validation/wiki/Download-It)
    * [Include it in your Angular Application project](/ghiscoding/angular-validation/wiki/Include-it-in-your-Angular-Application)
    * [Locales (languages)](/ghiscoding/angular-validation/wiki/Locales-(languages))
* Code Samples
    * [Directive Examples](/ghiscoding/angular-validation/wiki/Working-Directive-Examples)
    * [Service Examples](/ghiscoding/angular-validation/wiki/Working-Service-Examples)
    * [Alternate Text on Validators](/ghiscoding/angular-validation/wiki/Alternate-Text-on-Validators)
    * [DisplayErrorTo](/ghiscoding/angular-validation/wiki/Bootstrap-Input-Groups-Wrapping)
    * [Submit and Validation](/ghiscoding/angular-validation/wiki/Form-Submit-and-Validation)
    * [Validation Summary](/ghiscoding/angular-validation/wiki/Validation-Summary)
* Validators
    * [Available Validator Rules](/ghiscoding/angular-validation/wiki/Available-Validators-(rules))
    * [Regular Expression](/ghiscoding/angular-validation/wiki/Regular-Expressions-(Regex))
* Misc
    * [Changelog](/ghiscoding/angular-validation/wiki/CHANGELOG)
    * [License](/ghiscoding/angular-validation/wiki/License)

<a name="whyuseit"></a>
Why use angular-validation?
-----
Angular-validation was develop with simplicity and DRY (Don't Repeat Yourself) concept in mind.
You can transform this:
```html
<input type="text" name="username" ng-model="user.username" ng-minlength="3" ng-maxlength="8" required />
<div ng-show="form.$submitted || form.user.$touched">
  <span ng-show="userForm.username.$error.minlength" class="help-block">Username is too short.</p>
  <span ng-show="userForm.username.$error.maxlength" class="help-block">Username is too long.</p>
</div>
<input type="text" name="firstname" ng-model="user.firstname" ng-minlength="3" ng-maxlength="50" required />
<div ng-show="form.$submitted || form.user.$touched">
  <span ng-show="userForm.firstname.$error.minlength" class="help-block">Firstname is too short.</p>
  <span ng-show="userForm.firstname.$error.maxlength" class="help-block">Firstname is too long.</p>
</div>
<input type="text" name="lastname" ng-model="user.lastname" ng-minlength="2" ng-maxlength="50" required />
<div ng-show="form.$submitted || form.user.$touched">
  <span ng-show="userForm.lastname.$error.minlength" class="help-block">Lastname is too short.</p>
  <span ng-show="userForm.lastname.$error.maxlength" class="help-block">Lastname is too long.</p>
</div>
```
into this (errors will be displayed in your chosen locale translation):
```html
<input type="text" name="username" ng-model="user.username" validation="min_len:3|max_len:8|required"  />
<input type="text" name="firstname" ng-model="user.firstname" validation="alpha_dash|min_len:3|max_len:50|required"  />
<input type="text" name="lastname" ng-model="user.lastname" validation="alpha_dash|min_len:2|max_len:50|required"  />
```
The Angular-Validation will create, by itself, the necessary error message. Now imagine your form with 10 inputs, using the Angular-Validation will end up using 10 lines of code, while on the other hand using the default of Angular will give you 30 lines of code... so what are you waiting for? Use Angular-Validation!!! :)

Let's not forget the [Validation Summary](/ghiscoding/angular-validation/wiki/Validation-Summary) which is also a great and useful way of displaying your errors to the user.

<a name="install"></a>
Install
-----
Install with Bower

```javascript
// You can install with
bower install angular-validation-ghiscoding

// or as another alias
bower install ghiscoding.angular-validation
```
Install with NuGet (see the [NuGet Package Here](http://www.nuget.org/packages/Angular-Validation-Ghiscoding))
```javascript
PM> Install-Package Angular-Validation-Ghiscoding
```
When used with IIS, you will need to map the JSON type
```html
<staticContent>
    <mimeMap fileExtension=".json" mimeType="application/json" />
</staticContent>
```

<a name="changelog"></a>
## CHANGELOG
* [1.3.0](https://github.com/ghiscoding/angular-validation/commit/d106996926bef86a0457c90fbb65fe6233f3928d) `2014-12-01` Added support to AngularJS 1.3
* [1.3.1](https://github.com/ghiscoding/angular-validation/commit/44fe9de050504a46bb0eb975c31bc4b0f3b6f516) `2015-01-02` Added Input Match/Confirmation Validator, ex: password confirmation.
* [1.3.2](https://github.com/ghiscoding/angular-validation/commit/41f9ed9abc7a6d66d4ecf6418b810459bf1d8717) `2015-01-03` Float number validator to also permit dot (.) as first character. Also removed keyboard blocking of invalid character on input type="number" now displays error message.
* [1.3.3](https://github.com/ghiscoding/angular-validation/commit/7b3043a97006a3d7043b198f89c91f8b6c49476e) `2015-01-04` Added changelog & updated Bootstrap(3.3.1), AngularJS(1.3.7) to latest versions
* [1.3.4](https://github.com/ghiscoding/angular-validation/commit/ba30d55ddb8bca44a8032fc8253356450bd4e1d4) `2015-01-06` Removed the necessity of creating a `<span>` for displaying the error message, the directive now handles it by itself.
* [1.3.5](https://github.com/ghiscoding/angular-validation/commit/679b24ca4daee8419731c45d1d65d63cb5ca74a5) `2015-01-26` Throw an error message when user did not provide a `name=""` property inside the element to validate.
* [1.3.6](https://github.com/ghiscoding/angular-validation/commit/e47e91f45f93a3f191ab6849d06163563674e9e2) `2015-02-09` Added `ng-strict-di` for minification, renamed some files and folder lib to `/vendors`, moved directive into new `/src` folder for better separation.
* [1.3.7](https://github.com/ghiscoding/angular-validation/commit/86c16f720d6687d3b5ca93e49a0a37824027e583) `2015-03-08` Complete rewrite (but same functionality) so that I could add an Angular-Validation Service which is similar implementation as the Directive. Also added `debounce` attribute which is an alias to `typingLimit`, validation rules are now defined as an external service for better maintainability and also created a common file for shared functions by both Validation Directive and Service.
* [1.3.8](https://github.com/ghiscoding/angular-validation/commit/492d1060a91fb8b49fc70a0c7a1a581d904e0db0) `2015-03-15` Added between/min/max conditional validators on all Date types (iso, euro_long, euro_short, us_long, us_short)
* [1.3.9](https://github.com/ghiscoding/angular-validation/commit/931d3b04a00f0583612aefe28ad0bfcac326a38c) `2015-03-21` Added validation summary through 2 new and equivalent properties `$scope.$validationSummary` and `$scope.formName.$validationSummary`. Also added `bower` and `gulp` support, the Gulp script gives minified files.
* [1.3.10](https://github.com/ghiscoding/angular-validation/commit/18765a8dd986856a9fa176fc4835d90d25f663b2) `2015-03-29` Added new function of `checkFormValidity()` before submitting the form. Now use only 1 minified script instead of multiples.
* [1.3.11](https://github.com/ghiscoding/angular-validation/commit/e807584f0bcdf0f28ef2ef905b6bc4e890926ac1) `2015-03-30` Accepted pull request #15 to fix form without name attribute. Also accepted pull request #18 to add Spanish locales.
* [1.3.12](https://github.com/ghiscoding/angular-validation/commit/0af82337a6961923e3b022a19660237d3e6f7184) `2015-04-04` Fix issue #16 and added Validators Alternate Text option on all type of validators. Also fixed removeValidator and clean a lot of code.
* [1.3.13](https://github.com/ghiscoding/angular-validation/commit/d0440bdd7fc2816e03d28ad3a9c3bd7bee8ac519) `2015-04-06` Fixed $translate delay issue when using external JSON files
* [1.3.14](https://github.com/ghiscoding/angular-validation/pull/19) `2015-04-07` Merge pull request #19 Added norwegian translation and changes to allow user to remove invalid validators
* [1.3.15](https://github.com/ghiscoding/angular-validation/commit/24037e4b2e22658e7e2011c022ba4cca26f391d9) `2015-04-08` Fixed #23 If multiple forms exist in the app the errors in 1 form affect validation in the other
* [1.3.16](https://github.com/ghiscoding/angular-validation/commit/6c419d45bdb00341416d91199003d827259bd5da) `2015-04-09` Accept Merge #3 Fixed removeFromValidationSummary to also remove from 'local' array
* [1.3.17](https://github.com/ghiscoding/angular-validation/commit/1283a3a7435c70ec0a355ee273c8479e4b9bdabf) `2015-04-11` Added global `$scope.$validationOptions` [Global Options](#global-options) object, for now only has the `debounce` property that be used by both the Directive and Service.
* [1.3.18](https://github.com/ghiscoding/angular-validation/commit/d4b55741b9635cd5654f44c58c146f4d86b2e512) `2015-04-19` Fixed issue #20 - Error messages shown on submit are non-understandable, this was fixed using $translate promises instead of $translate.instant(). Fixed a few error display on the validationSummary() and checkFormValidity(). Also merged #27 to add Russian
* [1.3.19](https://github.com/ghiscoding/angular-validation/commit/2c1e5d62e434da24c122a5b575b5434e988ff254) `2015-04-20` Fixed issue #28 - unbind all 'blur' in cancelValidation() might affect other modules
* [1.3.20](https://github.com/ghiscoding/angular-validation/commit/b1a609573d8059482813ec4131b6b8cb682318cd) `2015-04-21` Fixed issue #26 - validation of forms inside ng-repeat (added sample `dynamicFormView` in `more-examples` folder). And again issue #28 - unbind all 'blur' in cancelValidation() might affect other modules.
* [1.3.21](https://github.com/ghiscoding/angular-validation/commit/4972810eabe66dc0ac24626113982af488c7d3a0) `2015-04-29` Moved the Alternate Text inside the $translate promise as well which removes possible delay of non-translated text appearing as alternate text (this will not affect regular text, or already translated text). Also cleanup code and made my Gulp task even more automated.
* [1.3.22]() `2015-05-03` Added new element attribute of `friendly-name` which is used ONLY in the ValidationSummary, this friendly name is to give a better element name display, which also support translation, inside the ValidationSummary instead of just "input1" (see ValidationSummary for more details).