/**
 * angular-validation-common (ghiscoding)
 * https://github.com/ghiscoding/angular-validation
 *
 * @author: Ghislain B.
 * @desc: angular-validation common functions used by both the Directive & Service
 *
 */
angular
  .module('ghiscoding.validation')
  .factory('validationCommon', ['$rootScope', '$timeout', '$translate', 'validationRules', function ($rootScope, $timeout, $translate, validationRules) {
    // global variables of our object (start with _var)
    var _bypassRootScopeReset = false;     // do we want to bypass the watch on the $rootScope? False by default
    var _bFieldRequired = false;           // by default we'll consider our field not required, if validation attribute calls it, then we'll start validating
    var _INACTIVITY_LIMIT = 1000;          // constant of maximum user inactivity time limit, this is the default cosntant but can be variable through typingLimit variable

    var _formElements = [];                // Array of all Form Elements, this is not a DOM Elements, these are custom objects defined as { fieldName, elm,  attrs, ctrl, isValid, message }
    var _globalOptions = {};               // Angular-Validation global options, could be define by scope.$validationOptions or by validationService.setGlobalOptions()
    var _remotePromises = [];              // keep track of promises called and running when using the Remote validator
    var _validationSummary = [];           // Array Validation Error Summary

    // watch on route change, then reset some global variables, so that we don't carry over other controller/view validations
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
      if (!_bypassRootScopeReset) {
        _globalOptions = {
          displayOnlyLastErrorMsg: false, // reset the option of displaying only the last error message
          preValidateFormElements: false, // reset the option of pre-validate all form elements, false by default
          isolatedScope: null,            // reset used scope on route change
          scope: null                     // reset used scope on route change
        };
        _formElements = [];                             // array containing all form elements, valid or invalid
        _validationSummary = [];                        // array containing the list of invalid fields inside a validationSummary
      }
    });

    // service constructor
    var validationCommon = function (scope, elm, attrs, ctrl) {
      this.bFieldRequired = false; // by default we'll consider our field as not required, if validation attribute calls it, then we'll start validating
      this.validators = [];
      this.typingLimit = _INACTIVITY_LIMIT;
      this.scope = scope;
      this.elm = elm;
      this.ctrl = ctrl;
      this.validatorAttrs = attrs;

      if(!!scope && !!scope.$validationOptions) {
        _globalOptions = scope.$validationOptions; // save the global options
      }

      // user could pass his own scope, useful in a case of an isolate scope
      if (!!scope && (!!_globalOptions.isolatedScope || !!_globalOptions.scope)) {
        this.scope = (!!_globalOptions.isolatedScope) ? _globalOptions.isolatedScope : _globalOptions.scope;  // overwrite original scope (isolatedScope/scope are equivalent arguments)
        _globalOptions = mergeObjects(scope.$validationOptions, _globalOptions);                              // reuse the validationOption from original scope
      }

      // only the angular-validation Directive can possibly reach this condition with all properties filled
      // on the other hand the angular-validation Service will `initialize()` function to initialize the same set of variables
      if (!!this.elm && !!this.validatorAttrs && !!this.ctrl && !!this.scope) {
        addToFormElementObjectList(this.elm, this.validatorAttrs, this.ctrl, this.scope);
        this.defineValidation();
      }
    };

    // list of available published public functions of this object
    validationCommon.prototype.arrayFindObject = arrayFindObject;                                   // search an object inside an array of objects
    validationCommon.prototype.defineValidation = defineValidation;                                 // define our validation object
    validationCommon.prototype.getFormElementByName = getFormElementByName;                         // get the form element custom object by it's name
    validationCommon.prototype.getFormElements = getFormElements;                                   // get the array of form elements (custom objects)
    validationCommon.prototype.getGlobalOptions = getGlobalOptions;                                 // get the global options used by all validators (usually called by the validationService)
    validationCommon.prototype.isFieldRequired = isFieldRequired;                                   // return boolean knowing if the current field is required
    validationCommon.prototype.initialize = initialize;                                             // initialize current object with passed arguments
    validationCommon.prototype.mergeObjects = mergeObjects;                                         // merge 2 javascript objects, Overwrites obj1's values with obj2's (basically Object2 as higher priority over Object1)
    validationCommon.prototype.removeFromValidationSummary = removeFromValidationSummary;           // remove an element from the $validationSummary
    validationCommon.prototype.removeFromFormElementObjectList = removeFromFormElementObjectList;   // remove named items from formElements list
    validationCommon.prototype.setBypassRootScopeReset = setBypassRootScopeReset;                   // setter on: do we want to bypass the root scope reset?
    validationCommon.prototype.setDisplayOnlyLastErrorMsg = setDisplayOnlyLastErrorMsg;             // setter on the behaviour of displaying only the last error message
    validationCommon.prototype.setGlobalOptions = setGlobalOptions;                                 // set global options used by all validators (usually called by the validationService)
    validationCommon.prototype.updateErrorMsg = updateErrorMsg;                                     // update on screen an error message below current form element
    validationCommon.prototype.validate = validate;                                                 // validate current element

    // override some default String functions
    String.prototype.trim = stringPrototypeTrim;
    String.prototype.format = stringPrototypeFormat;
    String.format = stringFormat;

    // return the service object
    return validationCommon;

    //----
    // Public functions declaration
    //----------------------------------

    /** Define our validation object
     * @return object self
     */
    function defineValidation() {
      var self = this;
      var customUserRegEx = {};
      self.validators = [];        // reset the global validators

      // debounce (alias of typingLimit) timeout after user stop typing and validation comes in play
      self.typingLimit = _INACTIVITY_LIMIT;
      if (self.validatorAttrs.hasOwnProperty('debounce')) {
        self.typingLimit = parseInt(self.validatorAttrs.debounce, 10);
      } else if (self.validatorAttrs.hasOwnProperty('typingLimit')) {
        self.typingLimit = parseInt(self.validatorAttrs.typingLimit, 10);
      } else if (!!_globalOptions && _globalOptions.hasOwnProperty('debounce')) {
        self.typingLimit = parseInt(_globalOptions.debounce, 10);
      }

      // get the rules(or validation), inside directive it's named (validation), inside service(rules)
      var rules = (self.validatorAttrs.hasOwnProperty('rules')) ? self.validatorAttrs.rules : self.validatorAttrs.validation;

      // We first need to see if the validation holds a custom user regex, if it does then deal with it first
      // So why deal with it separately? Because a Regex might hold pipe '|' and so we don't want to mix it with our regular validation pipe
      if(rules.indexOf("pattern=/") >= 0) {
        var matches = rules.match(/pattern=(\/.*?\/[igm]*)(:alt=(.*))?/);
        if (!matches || matches.length < 3) {
          throw 'Regex validator within the validation needs to be define with an opening "/" and a closing "/", please review your validator.';
        }
        var pattern = matches[1];
        var altMsg = (!!matches[2]) ? matches[2].replace(/\|(.*)/, '') : '';

        // convert the string into a real RegExp pattern
        var match = pattern.match(new RegExp('^/(.*?)/([gimy]*)$'));
        var regex = new RegExp(match[1], match[2]);

        customUserRegEx = {
          altMsg: altMsg,
          message: altMsg.replace(/:alt=/, ''),
          pattern: regex
        };

        // rewrite the rules so that it doesn't contain any regular expression
        // we simply remove the pattern so that it won't break the Angular-Validation since it also use the pipe |
        rules = rules.replace('pattern=' + pattern, 'pattern');
      }
      // DEPRECATED, in prior version of 1.3.34 and less, the way of writing a regular expression was through regex:/.../:regex
      // this is no longer supported but is still part of the code so that it won't break for anyone using previous way of validating
      // Return string will have the complete regex pattern removed but we will keep ':regex' so that we can still loop over it
      else if (rules.indexOf("regex:") >= 0) {
        var matches = rules.match("regex:(.*?):regex");
        if (matches.length < 2) {
          throw 'Regex validator within the validation needs to be define with an opening "regex:" and a closing ":regex", please review your validator.';
        }
        var regAttrs = matches[1].split(':=');
        customUserRegEx = {
          message: regAttrs[0],
          pattern: regAttrs[1]
        };

        // rewrite the rules so that it doesn't contain the regex: ... :regex ending
        // we simply remove it so that it won't break if there's a pipe | inside the actual regex
        rules = rules.replace(matches[0], 'regex:');
      }

      // at this point it's safe to split with pipe (since regex was previously stripped out)
      var validations = rules.split('|');

      if (validations) {
        self.bFieldRequired = (rules.indexOf("required") >= 0) ? true : false;

        // loop through all validators of the element
        for (var i = 0, ln = validations.length; i < ln; i++) {
          // params split will be:: [0]=rule, [1]=ruleExtraParams OR altText, [2] altText
          var params = validations[i].split(':');

          // check if user provided an alternate text to his validator (validator:alt=Alternate Text)
          var hasAltText = validations[i].indexOf("alt=") >= 0 ? true : false;

          self.validators[i] = validationRules.getElementValidators({
            altText: hasAltText === true ? (params.length === 2 ? params[1] : params[2]) : '',
            customRegEx: customUserRegEx,
            rule: params[0],
            ruleParams: (hasAltText && params.length === 2) ? null : params[1]
          });
        }
      }
      return self;
    } // defineValidation()

    /** Return a Form element object by it's name
     * @return array object elements
     */
    function getFormElementByName(elmName) {
      return arrayFindObject(_formElements, 'fieldName', elmName);
    }

    /** Return all Form elements
     * @return array object elements
     */
    function getFormElements(formName) {
      if(!!formName) {
        return arrayFindObjects(_formElements, 'formName', formName);
      }
      return _formElements;
    }

    /** Get global options used by all validators
     * @param object attrs: global options
     * @return object self
     */
    function getGlobalOptions() {
      return _globalOptions;
    }

    /** Initialize the common object
     * @param object scope
     * @param object elm
     * @param object attrs
     * @param object ctrl
     */
    function initialize(scope, elm, attrs, ctrl) {
      this.scope = scope;
      this.elm = elm;
      this.ctrl = ctrl;
      this.validatorAttrs = attrs;

      addToFormElementObjectList(elm, attrs, ctrl, scope);
      this.defineValidation();
    }

    /** @return isFieldRequired */
    function isFieldRequired() {
      var self = this;
      return self.bFieldRequired;
    }

    /**
     * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
     * When both object have the same property, the Object2 will higher priority over Object1 (basically that property will be overwritten inside Object1)
     * @param obj1
     * @param obj2
     * @return obj3 a new object based on obj1 and obj2
     */
    function mergeObjects(obj1, obj2) {
      var obj3 = {};
      for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
      for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }

      return obj3;
    }

    /** Remove objects from FormElement list.
     * @param elementName to remove
     */
    function removeFromFormElementObjectList(elmName) {
      var index = arrayFindObjectIndex(_formElements, 'fieldName', elmName); // find index of object in our array
      if (index >= 0) {
        _formElements.splice(index, 1);
      }
    }

    /** Remove an element from the $validationSummary array
     * @param object validationSummary
     * @param string elmName: element name
     */
    function removeFromValidationSummary(elmName, validationSummaryObj) {
      var self = this;
      var form = getElementParentForm(elmName, self);                         // find the parent form (only found if it has a name)
      var vsObj = (!!validationSummaryObj) ? validationSummaryObj : _validationSummary;

      var index = arrayFindObjectIndex(vsObj, 'field', elmName); // find index of object in our array
      // if message is empty, remove it from the validation summary object
      if (index >= 0) {
        vsObj.splice(index, 1);
      }
      // also remove from 'local' validationSummary
      index = arrayFindObjectIndex(_validationSummary, 'field', elmName); // find index of object in our array
      if (index >= 0) {
        _validationSummary.splice(index, 1);
      }

      self.scope.$validationSummary = _validationSummary;

      // overwrite the scope form (if found)
      if (!!form) {
        // since validationSummary contain errors of all forms
        // we need to find only the errors of current form and them into the current scope form object
        form.$validationSummary = arrayFindObjects(_validationSummary, 'formName', form.$name);
      }

      // overwrite the ControllerAs alias if it was passed in the global options
      if (!!_globalOptions && !!_globalOptions.controllerAs) {
        _globalOptions.controllerAs.$validationSummary = _validationSummary;

        // also overwrite it inside controllerAs form (if found)
        if (!!form) {
          var formName = form.$name.indexOf('.') >= 0 ? form.$name.split('.')[1] : form.$name;
          _globalOptions.controllerAs[formName].$validationSummary = arrayFindObjects(_validationSummary, 'formName', form.$name);
        }
      }


      return _validationSummary;
    }

    /** Setter on the action of bypassing the root scope reset, you can change the default behavior with this function here.
     * Explanation: By default a route change will trigger a reset of some global variables (formElements, validationSummary),
     * so that we don't see validations of previous routes or controllers.
     * @param boolean value
     */
    function setBypassRootScopeReset(boolValue) {
      _bypassRootScopeReset = boolValue;
    }

    /** Setter on the behaviour of displaying only the last error message of each element.
     * By default this is false, so the behavior is to display all error messages of each element.
     * @param boolean value
     */
    function setDisplayOnlyLastErrorMsg(boolValue) {
      _globalOptions.displayOnlyLastErrorMsg = boolValue;
    }

    /** Set and initialize global options used by all validators
     * @param object attrs: global options
     * @return object self
     */
    function setGlobalOptions(options) {
      var self = this;

      // merge both attributes but 2nd object (attrs) as higher priority, so that for example debounce property inside `attrs` as higher priority over `validatorAttrs`
      // so the position inside the mergeObject call is very important
      _globalOptions = mergeObjects(_globalOptions, options); // save in global

      return self;
    }

    /** in general we will display error message at the next element after our input as <span class="validation validation-inputName text-danger">
      * but in some cases user might want to define which DOM id to display error (as validation attribute)
      * @param string message: error message to display
      * @param object attributes
      */
    function updateErrorMsg(message, attrs) {
      var self = this;
      // attrs.obj if set, should be a commonObj, and can be self.
      // In addition we need to set validatorAttrs, as they are defined as attrs on obj.
      if (!!attrs && attrs.obj) {
        self = attrs.obj;
        self.validatorAttrs = attrs.obj.attrs;
      }

      // element name could be defined in the `attrs` or in the self object
      var elm = (!!attrs && attrs.elm) ? attrs.elm : self.elm;
      var elmName = (!!elm && elm.attr('name')) ? elm.attr('name') : null;

      // Make sure that element has a name="" attribute else it will not work
      if (typeof elmName === "undefined" || elmName === null) {
        var ngModelName = (!!elm) ? elm.attr('ng-model') : 'unknown';
        throw 'Angular-Validation Service requires you to have a (name="") attribute on the element to validate... Your element is: ng-model="' + ngModelName + '"';
      }

      // user might have passed a message to be translated
      var errorMsg = (!!attrs && !!attrs.translate) ? $translate.instant(message) : message;

      // get the name attribute of current element, make sure to strip dirty characters, for example remove a <input name="options[]"/>, we need to strip the "[]"
      var elmInputName = elmName.replace(/[|&;$%@"<>()+,\[\]\{\}]/g, '');
      var errorElm = null;

      // find the element which we'll display the error message, this element might be defined by the user with 'validationErrorTo'
      if (!!self.validatorAttrs && self.validatorAttrs.hasOwnProperty('validationErrorTo')) {
        // validationErrorTo can be used in 3 different ways: with '.' (element error className) or with/without '#' (element error id)
        var firstChar = self.validatorAttrs.validationErrorTo.charAt(0);
        var selector = (firstChar === '.' || firstChar === '#') ? self.validatorAttrs.validationErrorTo : '#' + self.validatorAttrs.validationErrorTo;
        errorElm = angular.element(document.querySelector(selector));
      }
      // errorElm can be empty due to:
      //  1. validationErrorTo has not been set
      //  2. validationErrorTo has been mistyped, and if mistyped, use regular functionality
      if (!errorElm || errorElm.length === 0) {
        // most common way, let's try to find our <span class="validation-inputName">
        errorElm = angular.element(document.querySelector('.validation-' + elmInputName));
      }

      // form might have already been submitted
      var isSubmitted = (!!attrs && attrs.isSubmitted) ? attrs.isSubmitted : false;

      // invalid & isDirty, display the error message... if <span> not exist then create it, else udpate the <span> text
      if (!!attrs && !attrs.isValid && (isSubmitted || self.ctrl.$dirty || self.ctrl.$touched)) {
        (errorElm.length > 0) ? errorElm.text(errorMsg) : elm.after('<span class="validation validation-' + elmInputName + ' text-danger">' + errorMsg + '</span>');
      } else {
        errorElm.text('');  // element is pristine or no validation applied, error message has to be blank
      }
    }

    /** Validate function, from the input value it will go through all validators (separated by pipe)
     *  that were passed to the input element and will validate it. If field is invalid it will update
     *  the error text of the span/div element dedicated for that error display.
     * @param string value: value of the input field
     * @param bool showError: do we want to show the error or hide it (false is useful for adding error to $validationSummary without displaying it on screen)
     * @return bool isFieldValid
     */
    function validate(strValue, showError) {
      var self = this;
      var isValid = true;
      var isFieldValid = true;
      var message = '';
      var regex;
      var validator;

      // to make proper validation, our element value cannot be an undefined variable (we will at minimum make it an empty string)
      // For example, in some particular cases "undefined" returns always True on regex.test() which is incorrect especiall on max_len:x
      if (typeof strValue === "undefined") {
        strValue = '';
      }

      // get some common variables
      var elmName = (!!self.ctrl && !!self.ctrl.$name)
        ? self.ctrl.$name
        : (!!self.attrs && !!self.attrs.name)
          ? self.attrs.name
          : self.elm.attr('name');

      var formElmObj = getFormElementByName(elmName);
      var rules = self.validatorAttrs.hasOwnProperty('rules') ? self.validatorAttrs.rules : self.validatorAttrs.validation;

      // loop through all validators (could be multiple)
      for (var j = 0, jln = self.validators.length; j < jln; j++) {
        validator = self.validators[j];

        if (validator.type === "conditionalDate") {
          // 1- we first need to validate that the Date input is well formed through regex
          // run the Regex test through each iteration, if required (\S+) and is null then it's invalid automatically
          regex = new RegExp(validator.pattern);
          isValid = ((!validator.pattern || validator.pattern.toString() === "/\\S+/" || (!!rules && validator.pattern === "required")) && strValue === null) ? false : regex.test(strValue);

          // 2- date is valid, then we can do our conditional date check
          if (isValid) {
            // For Date comparison, we will need to construct a Date Object that follows the ECMA so then it could work in all browser
            // Then convert to timestamp & finally we can compare both dates for filtering
            var dateType = validator.dateType;                   // date type (ISO, EURO, US-SHORT, US-LONG)
            var timestampValue = parseDate(strValue, dateType).getTime(); // our input value parsed into a timestamp

            // if 2 params, then it's a between condition
            if (validator.params.length == 2) {
              // this is typically a "between" condition, a range of number >= and <=
              var timestampParam0 = parseDate(validator.params[0], dateType).getTime();
              var timestampParam1 = parseDate(validator.params[1], dateType).getTime();
              var isValid1 = testCondition(validator.condition[0], timestampValue, timestampParam0);
              var isValid2 = testCondition(validator.condition[1], timestampValue, timestampParam1);
              isValid = (isValid1 && isValid2) ? true : false;
            } else {
              // else, 1 param is a simple conditional date check
              var timestampParam = parseDate(validator.params[0], dateType).getTime();
              isValid = testCondition(validator.condition, timestampValue, timestampParam);
            }
          }
        }
        // it might be a conditional number checking
        else if (validator.type === "conditionalNumber") {
          // if 2 params, then it's a between condition
          if (validator.params.length == 2) {
            // this is typically a "between" condition, a range of number >= and <=
            var isValid1 = testCondition(validator.condition[0], parseFloat(strValue), parseFloat(validator.params[0]));
            var isValid2 = testCondition(validator.condition[1], parseFloat(strValue), parseFloat(validator.params[1]));
            isValid = (isValid1 && isValid2) ? true : false;
          } else {
            // else, 1 param is a simple conditional number check
            isValid = testCondition(validator.condition, parseFloat(strValue), parseFloat(validator.params[0]));
          }
        }
        // it might be a match input checking
        else if (validator.type === "match") {
          // get the element 'value' ngModel to compare to (passed as params[0], via an $eval('ng-model="modelToCompareName"')
          var otherNgModel = validator.params[0];
          var otherNgModelVal = self.scope.$eval(otherNgModel);
          isValid = (otherNgModelVal === strValue && !!strValue);
        }
        // it might be a remote validation, this should return a promise with the result as a boolean or a { isValid: bool, message: msg }
        else if (validator.type === "remote") {
          if (!!strValue && !!showError) {
            self.ctrl.$processing = true; // $processing can be use in the DOM to display a remote processing message to the user

            var fct = null;
            var fname = validator.params[0];
            if (fname.indexOf(".") === -1) {
              fct = self.scope[fname];
            } else {
              // function name might also be declared with the Controller As alias, for example: vm.customRemote()
              // split the name and flatten it to find it inside the scope
              var split = fname.split('.');
              fct = self.scope;
              for (var k = 0, kln = split.length; k < kln; k++) {
                fct = fct[split[k]];
              }
            }
            var promise = (typeof fct === "function") ? fct() : null;

            // if we already have previous promises running, we might want to abort them (if user specified an abort function)
            if (_remotePromises.length > 1) {
              while (_remotePromises.length > 0) {
                var previousPromise = _remotePromises.pop();
                if (typeof previousPromise.abort === "function") {
                  previousPromise.abort(); // run the abort if user declared it
                }
              }
            }
            _remotePromises.push(promise); // always add to beginning of array list of promises

            if (!!promise && typeof promise.then === "function") {
              self.ctrl.$setValidity('remote', false); // make the field invalid before processing it

              // process the promise
              (function (altText) {
                promise.then(function (result) {
                  result = result.data || result;
                  _remotePromises.pop();                 // remove the last promise from array list of promises

                  self.ctrl.$processing = false;  // finished resolving, no more pending
                  var errorMsg = message + ' ';   // use the global error message

                  if (typeof result === "boolean") {
                    isValid = (!!result) ? true : false;
                  } else if (typeof result === "object") {
                    isValid = (!!result.isValid) ? true : false;
                  }

                  if (isValid === false) {
                    formElmObj.isValid = false;
                    errorMsg += (!!result.message) ? result.message : altText;

                    // is field is invalid and we have an error message given, then add it to validationSummary and display error
                    addToValidationAndDisplayError(self, formElmObj, errorMsg, false, showError);
                  }
                  if (isValid === true && isFieldValid === true) {
                    // if field is valid from the remote check (isValid) and from the other validators check (isFieldValid)
                    // clear up the error message and make the field directly as Valid with $setValidity since remote check arrive after all other validators check
                    formElmObj.isValid = true;
                    self.ctrl.$setValidity('remote', true);
                    addToValidationAndDisplayError(self, formElmObj, '', true, showError);
                  }
                });
              })(validator.altText);
            } else {
              throw 'Remote Validation requires a declared function (in your Controller) which also needs to return a Promise, please review your code.'
            }
          }
        }
        // or finally it might be a regular regex pattern checking
        else {
          // get the ngDisabled attribute if found
          var elmAttrNgDisabled = (typeof self.attrs !== "undefined") ? self.attrs.ngDisabled : self.validatorAttrs.ngDisabled;

          // a 'disabled' element should always be valid, there is no need to validate it
          if (!!self.elm.prop("disabled") || !!self.scope.$eval(elmAttrNgDisabled)) {
            isValid = true;
          } else {
            // before running Regex test, we'll make sure that an input of type="number" doesn't hold invalid keyboard chars, if true skip Regex
            if (typeof strValue === "string" && strValue === "" && self.elm.prop('type').toUpperCase() === "NUMBER") {
              isValid = false;
              //message = $translate.instant("INVALID_KEY_CHAR");
            } else {
              // run the Regex test through each iteration, if required (\S+) and is null then it's invalid automatically
              regex = new RegExp(validator.pattern);
              isValid = ((!validator.pattern || validator.pattern.toString() === "/\\S+/" || (!!rules && validator.pattern === "required")) && strValue === null) ? false : regex.test(strValue);
            }
          }
        }

        // not required and not filled is always valid & 'disabled', 'ng-disabled' elements should always be valid
        if ((!self.bFieldRequired && !strValue) || (!!self.elm.prop("disabled") || !!self.scope.$eval(elmAttrNgDisabled))) {
          isValid = true;
        }

        if (!isValid) {
          isFieldValid = false;

          // run $translate promise, use closures to keep access to all necessary variables
          (function (formElmObj, isValid, validator) {
            var msgToTranslate = validator.message;
            if (!!validator.altText && validator.altText.length > 0) {
              msgToTranslate = validator.altText.replace("alt=", "");
            }

            $translate(msgToTranslate).then(function (translation) {
              // if user is requesting to see only the last error message, we will use '=' instead of usually concatenating with '+='
              // then if validator rules has 'params' filled, then replace them inside the translation message (foo{0} {1}...), same syntax as String.format() in C#
              if (message.length > 0 && _globalOptions.displayOnlyLastErrorMsg) {
                message = ' ' + ((!!validator && !!validator.params) ? String.format(translation, validator.params) : translation);
              } else {
                message += ' ' + ((!!validator && !!validator.params) ? String.format(translation, validator.params) : translation);
              }
              addToValidationAndDisplayError(self, formElmObj, message, isFieldValid, showError);
            })
            ["catch"](function (data) {
              // error caught:
              // alternate text might not need translation if the user sent his own custom message or is already translated
              // so just send it directly into the validation summary.
              if (!!validator.altText && validator.altText.length > 0) {
                // if user is requesting to see only the last error message
                if (message.length > 0 && _globalOptions.displayOnlyLastErrorMsg) {
                  message = ' ' + msgToTranslate;
                } else {
                  message += ' ' + msgToTranslate;
                }
                addToValidationAndDisplayError(self, formElmObj, message, isFieldValid, showError);
              }
            });
          })(formElmObj, isValid, validator);
        } // if(!isValid)
      }   // for() loop

      // only log the invalid message in the $validationSummary
      if (isValid) {
        addToValidationSummary(self, '');
        self.updateErrorMsg('', { isValid: isValid });
      }

      if (!!formElmObj) {
        formElmObj.isValid = isFieldValid;
        if (isFieldValid) {
          formElmObj.message = '';
        }
      }
      return isFieldValid;
    } // validate()

    //----
    // Private functions declaration
    //----------------------------------

    /** Add to the Form Elements Array of Object List
     * @param object elm
     * @param object attrs
     * @param object ctrl
     */
    function addToFormElementObjectList(elm, attrs, ctrl, scope) {
      var elmName = (!!attrs.name) ? attrs.name : elm.attr('name');
      var form = getElementParentForm(elmName, { scope: scope });                         // find the parent form (only found if it has a name)
      var friendlyName = (!!attrs && !!attrs.friendlyName) ? $translate.instant(attrs.friendlyName) : '';
      var formElm = { fieldName: elmName, friendlyName: friendlyName, elm: elm, attrs: attrs, ctrl: ctrl, scope: scope, isValid: false, message: '', formName: (!!form) ? form.$name : null };
      var index = arrayFindObjectIndex(_formElements, 'fieldName', elm.attr('name')); // find index of object in our array
      if (index >= 0) {
        _formElements[index] = formElm;
      } else {
        _formElements.push(formElm);
      }
      return _formElements;
    }

    /** Will add error to the validationSummary and also display the error message if requested
     * @param object self
     * @param object formElmObj
     * @param string message: error message
     * @param bool showError
     */
    function addToValidationAndDisplayError(self, formElmObj, message, isFieldValid, showError) {
      // trim any white space
      message = message.trim();

      // log the invalid message in the $validationSummary
      addToValidationSummary(formElmObj, message);

      // change the Form element object boolean flag from the `formElements` variable, used in the `checkFormValidity()`
      if (!!formElmObj) {
        formElmObj.message = message;
      }

      // if user is pre-validating all form elements, display error right away
      if (!!self.validatorAttrs.preValidateFormElements || !!_globalOptions.preValidateFormElements) {
        // make the element as it was touched for CSS, only works in AngularJS 1.3+
        if (!!formElmObj && typeof self.ctrl.$setTouched === "function") {
          formElmObj.ctrl.$setTouched();
        }
        // only display errors on page load, when elements are not yet dirty
        if (self.ctrl.$dirty === false) {
          updateErrorMsg(message, { isSubmitted: true, isValid: isFieldValid, obj: formElmObj });
        }
      }

      // error Display
      if (showError && !!formElmObj && !formElmObj.isValid) {
        self.updateErrorMsg(message, { isValid: isFieldValid });
      } else if (!!formElmObj && formElmObj.isValid) {
        addToValidationSummary(formElmObj, '');
      }
    }

    /** Add the error to the validation summary
     * @param object self
     * @param string message: error message
     */
    function addToValidationSummary(self, message) {
      if (typeof self === "undefined" || self == null) {
        return;
      }

      // get the element name, whichever we find it
      var elmName = (!!self.ctrl && !!self.ctrl.$name)
        ? self.ctrl.$name
        : (!!self.attrs && !!self.attrs.name)
          ? self.attrs.name
          : self.elm.attr('name');

      var form = getElementParentForm(elmName, self);                         // find the parent form (only found if it has a name)
      var index = arrayFindObjectIndex(_validationSummary, 'field', elmName);  // find index of object in our array

      // if message is empty, remove it from the validation summary
      if (index >= 0 && message === '') {
        _validationSummary.splice(index, 1);
      } else if (message !== '') {
        var friendlyName = (!!self.attrs && !!self.friendlyName) ? $translate.instant(self.friendlyName) : '';
        var errorObj = { field: elmName, friendlyName: friendlyName, message: message, formName: (!!form) ? form.$name : null };

        // if error already exist then refresh the error object inside the array, else push it to the array
        if (index >= 0) {
          _validationSummary[index] = errorObj;
        } else {
          _validationSummary.push(errorObj);
        }
      }

      // save validation summary into scope root
      self.scope.$validationSummary = _validationSummary;

      // and also save it inside the current scope form (if found)
      if (!!form) {
        // since validationSummary contain errors of all forms
        // we need to find only the errors of current form and them into the current scope form object
        form.$validationSummary = arrayFindObjects(_validationSummary, 'formName', form.$name);
      }

      // also save it inside the ControllerAs alias if it was passed in the global options
      if (!!_globalOptions && !!_globalOptions.controllerAs) {
        _globalOptions.controllerAs.$validationSummary = _validationSummary;

        // also save it inside controllerAs form (if found)
        if (!!form) {
          var formName = form.$name.indexOf('.') >= 0 ? form.$name.split('.')[1] : form.$name;
          _globalOptions.controllerAs[formName].$validationSummary = arrayFindObjects(_validationSummary, 'formName', form.$name);
        }
      }

      return _validationSummary;
    }

    /** Quick function to find an object inside an array by it's given field name and value, return the object found or null
     * @param Array sourceArray
     * @param string searchId: search property id
     * @param string searchValue: value to search
     * @return object found from source array or null
     */
    function arrayFindObject(sourceArray, searchId, searchValue) {
      if (!!sourceArray) {
        for (var i = 0; i < sourceArray.length; i++) {
          if (sourceArray[i][searchId] === searchValue) {
            return sourceArray[i];
          }
        }
      }
      return null;
    }

    /** Quick function to find all object(s) inside an array of objects by it's given field name and value, return array of object found(s) or empty array
     * @param Array sourceArray
     * @param string searchId: search property id
     * @param string searchValue: value to search
     * @return array of object found from source array
     */
    function arrayFindObjects(sourceArray, searchId, searchValue) {
      var results = [];
      if (!!sourceArray) {
        for (var i = 0; i < sourceArray.length; i++) {
          if (sourceArray[i][searchId] === searchValue) {
            results.push(sourceArray[i]);
          }
        }
      }
      return results;
    }

    /** Quick function to find an object inside an array by it's given field name and value, return the index position found or -1
     * @param Array sourceArray
     * @param string searchId: search property id
     * @param string searchValue: value to search
     * @return int index position found
     */
    function arrayFindObjectIndex(sourceArray, searchId, searchValue) {
      if (!!sourceArray) {
        for (var i = 0; i < sourceArray.length; i++) {
          if (sourceArray[i][searchId] === searchValue) {
            return i;
          }
        }
      }

      return -1;
    }

    /** Explode a '.' dot notation string to an object
     * @param string str
     * @parem object
     * @return object
     */
    function explodedDotNotationStringToObject(str, obj) {
      var split = str.split('.');

      for (var k = 0, kln = split.length; k < kln; k++) {
        if(!!obj[split[k]]) {
          obj = obj[split[k]];
        }
      }
      return obj;
    }

    /** Get the element's parent Angular form (if found)
     * @param object self
     * @return object scope form
     */
    function getElementParentForm(elmName, self) {
      // from the element passed, get his parent form
      var forms = document.getElementsByName(elmName);
      var parentForm = null;

      for (var i = 0; i < forms.length; i++) {
        var form = forms[i].form;

        if (!!form && !!form.name) {
          parentForm = (!!_globalOptions && !!_globalOptions.controllerAs && form.name.indexOf('.') >= 0)
            ? explodedDotNotationStringToObject(form.name, self.scope)
            : self.scope[form.name];

          if(!!parentForm) {
            if (typeof parentForm.$name === "undefined") {
              parentForm.$name = form.name; // make sure it has a $name, since we use that variable later on
            }
            return parentForm;
          }
        }
      }

      // falling here with a form name but without a form object found in the scope is often due to isolate scope
      // we can hack it and define our own form inside this isolate scope, in that way we can still use something like: isolateScope.form1.$validationSummary
      if (!!form && !!form.name) {
        var obj = { $name: form.name, specialNote: 'Created by Angular-Validation for Isolated Scope usage' };

        if (!!_globalOptions && !!_globalOptions.controllerAs && form.name.indexOf('.') >= 0) {
          var formSplit = form.name.split('.');
          return self.scope[formSplit[0]][formSplit[1]] = obj
        }
        return self.scope[form.name] = obj;
      }
      return null;
    }

    /** Parse a date from a String and return it as a Date Object to be valid for all browsers following ECMA Specs
     * Date type ISO (default), US, UK, Europe, etc... Other format could be added in the switch case
     * @param String dateStr: date String
     * @param String dateType: date type (ISO, US, etc...)
     * @return object date
     */
    function parseDate(dateStr, dateType) {
      // variables declaration
      var dateSubStr = '', dateSeparator = '-', dateSplit = [], timeSplit = [], year = '', month = '', day = '';

      // Parse using the date type user selected, (separator could be dot, slash or dash)
      switch (dateType.toUpperCase()) {
        case 'EURO_LONG':
        case 'EURO-LONG': // UK, Europe long format is: dd/mm/yyyy hh:mm:ss
          dateSubStr = dateStr.substring(0, 10);
          dateSeparator = dateStr.substring(2, 3);
          dateSplit = splitDateString(dateSubStr, dateSeparator);
          day = dateSplit[0];
          month = dateSplit[1];
          year = dateSplit[2];
          timeSplit = (dateStr.length > 8) ? dateStr.substring(9).split(':') : null;
          break;
        case 'UK':
        case 'EURO':
        case 'EURO_SHORT':
        case 'EURO-SHORT':
        case 'EUROPE':  // UK, Europe format is: dd/mm/yy hh:mm:ss
          dateSubStr = dateStr.substring(0, 8);
          dateSeparator = dateStr.substring(2, 3);
          dateSplit = splitDateString(dateSubStr, dateSeparator);
          day = dateSplit[0];
          month = dateSplit[1];
          year = (parseInt(dateSplit[2]) < 50) ? ('20' + dateSplit[2]) : ('19' + dateSplit[2]); // below 50 we'll consider that as century 2000's, else in century 1900's
          timeSplit = (dateStr.length > 8) ? dateStr.substring(9).split(':') : null;
          break;
        case 'US_LONG':
        case 'US-LONG':    // US long format is: mm/dd/yyyy hh:mm:ss
          dateSubStr = dateStr.substring(0, 10);
          dateSeparator = dateStr.substring(2, 3);
          dateSplit = splitDateString(dateSubStr, dateSeparator);
          month = dateSplit[0];
          day = dateSplit[1];
          year = dateSplit[2];
          timeSplit = (dateStr.length > 8) ? dateStr.substring(9).split(':') : null;
          break;
        case 'US':
        case 'US_SHORT':
        case 'US-SHORT':    // US short format is: mm/dd/yy hh:mm:ss OR
          dateSubStr = dateStr.substring(0, 8);
          dateSeparator = dateStr.substring(2, 3);
          dateSplit = splitDateString(dateSubStr, dateSeparator);
          month = dateSplit[0];
          day = dateSplit[1];
          year = (parseInt(dateSplit[2]) < 50) ? ('20' + dateSplit[2]) : ('19' + dateSplit[2]); // below 50 we'll consider that as century 2000's, else in century 1900's
          timeSplit = (dateStr.length > 8) ? dateStr.substring(9).split(':') : null;
          break;
        case 'ISO':
        default:    // ISO format is: yyyy-mm-dd hh:mm:ss (separator could be dot, slash or dash: ".", "/", "-")
          dateSubStr = dateStr.substring(0, 10);
          dateSeparator = dateStr.substring(4, 5);
          dateSplit = splitDateString(dateSubStr, dateSeparator);
          year = dateSplit[0];
          month = dateSplit[1];
          day = dateSplit[2];
          timeSplit = (dateStr.length > 10) ? dateStr.substring(11).split(':') : null;
          break;
      }

      // parse the time if it exist else put them at 0
      var hour = (!!timeSplit && timeSplit.length === 3) ? timeSplit[0] : 0;
      var min = (!!timeSplit && timeSplit.length === 3) ? timeSplit[1] : 0;
      var sec = (!!timeSplit && timeSplit.length === 3) ? timeSplit[2] : 0;

      // Construct a valid Date Object that follows the ECMA Specs
      // Note that, in JavaScript, months run from 0 to 11, rather than 1 to 12!
      return new Date(year, month - 1, day, hour, min, sec);
    }

    /** From a date substring split it by a given separator and return a split array
     * @param string dateSubStr
     * @param string dateSeparator
     * @return array date splitted
     */
    function splitDateString(dateSubStr, dateSeparator) {
      var dateSplit = [];

      switch (dateSeparator) {
        case '/':
          dateSplit = dateSubStr.split('/'); break;
        case '.':
          dateSplit = dateSubStr.split('.'); break;
        case '-':
        default:
          dateSplit = dateSubStr.split('-'); break;
      }

      return dateSplit;
    }

    /** Test values with condition, I have created a switch case for all possible conditions.
     * @param string condition: condition to filter with
     * @param any value1: 1st value to compare, the type could be anything (number, String or even Date)
     * @param any value2: 2nd value to compare, the type could be anything (number, String or even Date)
     * @return boolean: a boolean result of the tested condition (true/false)
     */
    function testCondition(condition, value1, value2) {
      var result = false;

      switch (condition) {
        case '<': result = (value1 < value2) ? true : false; break;
        case '<=': result = (value1 <= value2) ? true : false; break;
        case '>': result = (value1 > value2) ? true : false; break;
        case '>=': result = (value1 >= value2) ? true : false; break;
        case '!=':
        case '<>': result = (value1 != value2) ? true : false; break;
        case '=':
        case '==': result = (value1 == value2) ? true : false; break;
        default: result = false; break;
      }
      return result;
    }

    /** Override javascript trim() function so that it works accross all browser platforms */
    function stringPrototypeTrim() {
      return this.replace(/^\s+|\s+$/g, '');
    }

    /** Override javascript format() function to be the same as the effect as the C# String.Format
     * Input: "Some {0} are showing {1}".format("inputs", "invalid");
     * Output: "Some inputs are showing invalid"
     * @param string
     * @param replacements
      */
    function stringPrototypeFormat() {
      var args = (Array.isArray(arguments[0])) ? arguments[0] : arguments;
      return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    }

    /** Override javascript String.format() function to be the same as the effect as the C# String.Format
     * Input: String.format("Some {0} are showing {1}", "inputs", "invalid");
     * Output: "Some inputs are showing invalid"
     * @param string
     * @param replacements
      */
    function stringFormat(format) {
      var args = (Array.isArray(arguments[1])) ? arguments[1] : Array.prototype.slice.call(arguments, 1);

      return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    }

  }]); // validationCommon service