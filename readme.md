#Angular Validation (Directive / Service)
`Version: 1.3.23`
### Form validation after user inactivity of default 1sec. (customizable timeout)

Forms Validation with Angular made easy! Angular-Validation is an angular directive/service with locales (languages) with a very simple approach of defining your `validation=""` directly within your element to validate (input, textarea, etc) and...that's it!!! The directive/service will take care of the rest!

The base concept is not new, it comes from the easy form input validation approach of Laravel Framework as well as PHP Gump Validation. They both are built in PHP and use a very simple approach, so why not use the same concept over Angular as well? Well now it is available with few more extras.

For a smoother user experience, I also added validation on inactivity (timer/debounce). So validation will not bother the user while he is still typing... though as soon as the user pauses for a certain amount of time, then validation comes into play. It's worth knowing that this inactivity timer is only available while typing, if user focuses away from his input (onBlur) it will then validate instantly.

Supporting AngularJS 1.3.x *(current code should work with 1.2.x just the same, but is no more verified)*

Now support <b>Service</b> using the same functionalities as the <b>Directive</b>.
Huge rewrite to have a better code separation and also adding support to Service functionalities. Specifically the `validation-rules` was separated to add rules without affecting the core while `validation-common` is for shared functions (shared by Directive/Service).

[Validation Summary](/ghiscoding/angular-validation/wiki/Validation-Summary) was also recently added to easily show all validation errors that are still active on the form and you can also use 2 ways of dealing with the [Submit and Validation](/ghiscoding/angular-validation/wiki/Form-Submit-and-Validation) button.

For more reasons to use it, see the answered question of: [Why Use It?](#whyuseit)

If you do use Angular-Validation, please click on the **Star** and add it as a favourite. The more star ratings there is, the more chances it could found by other users inside the popular trend section. That is the only support I ask you... thanks ;)

<a name="plunker"></a>
## Live Demo
[Plunker](http://plnkr.co/jADq7H)

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
into the following (errors will be displayed in your chosen locale translation):
```html
<input type="text" name="username" ng-model="user.username" validation="min_len:3|max_len:8|required"  />
<input type="text" name="firstname" ng-model="user.firstname" validation="alpha_dash|min_len:3|max_len:50|required"  />
<input type="text" name="lastname" ng-model="user.lastname" validation="alpha_dash|min_len:2|max_len:50|required"  />
```
The Angular-Validation will create, by itself, the necessary error message. Now imagine your form having 10 inputs, using the documented Angular way will end up being 30 lines of code, while on the other hand `Angular-Validation` will stay with 10 lines of code, no more... so what are you waiting for? Use Angular-Validation!!!  Don't forget to add it to your favorite, click on the **Star** :)

Let's not forget the [Validation Summary](/ghiscoding/angular-validation/wiki/Validation-Summary) which is also a great and useful way of displaying your errors to the user.


## Angular-Validation Wiki
All the documentation has been moved to the Wiki section, see the [github wiki](https://github.com/ghiscoding/angular-validation/wiki) for more explanation.

**Wiki Contents**
* [Angular-Validation Wiki](https://github.com/ghiscoding/angular-validation/wiki)
* Installation
    * [Bower/NuGet Packages](https://github.com/ghiscoding/angular-validation/wiki/Download-and-Install-it)
    * [Include it in your Angular Application project](https://github.com/ghiscoding/angular-validation/wiki/Include-it-in-your-Angular-Application)
    * [Locales (languages)](https://github.com/ghiscoding/angular-validation/wiki/Locales-(languages))
* Code Samples
    * [Directive Examples](https://github.com/ghiscoding/angular-validation/wiki/Working-Directive-Examples)
    * [Service Examples](https://github.com/ghiscoding/angular-validation/wiki/Working-Service-Examples)
    * [Alternate Text on Validators](https://github.com/ghiscoding/angular-validation/wiki/Alternate-Text-on-Validators)
    * [DisplayErrorTo](https://github.com/ghiscoding/angular-validation/wiki/Bootstrap-Input-Groups-Wrapping)
    * [Submit and Validation](https://github.com/ghiscoding/angular-validation/wiki/Form-Submit-and-Validation)
    * [Validation Summary](https://github.com/ghiscoding/angular-validation/wiki/Validation-Summary)
* Validators
    * [Available Validator Rules](https://github.com/ghiscoding/angular-validation/wiki/Available-Validators-(rules))
    * [Regular Expression](https://github.com/ghiscoding/angular-validation/wiki/Regular-Expressions-(Regex))
* Misc
    * [Changelog](https://github.com/ghiscoding/angular-validation/wiki/CHANGELOG)
    * [License](https://github.com/ghiscoding/angular-validation/wiki/License)

<a name="install"></a>
Download and Install it
-----
Install with **Bower**

```javascript
// You can install with
bower install angular-validation-ghiscoding

// or as another alias
bower install ghiscoding.angular-validation
```
Install with **NuGet** (see the [NuGet Package Here](http://www.nuget.org/packages/Angular-Validation-Ghiscoding))
```javascript
PM> Install-Package Angular-Validation-Ghiscoding
```
When used with IIS, you will need to map the JSON type
```html
<staticContent>
    <mimeMap fileExtension=".json" mimeType="application/json" />
</staticContent>
```

###License
[MIT License](http://www.opensource.org/licenses/mit-license.php)