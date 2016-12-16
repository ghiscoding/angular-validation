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
  .factory('ValidationCommon', ['$rootScope', '$timeout', '$translate', 'ValidationRules', function ($rootScope, $timeout, $translate, ValidationRules) {
    // global variables of our object (start with _var), these variables are shared between the Directive & Service
    var _bFieldRequired = false;              // by default we'll consider our field not required, if validation attribute calls it, then we'll start validating
    var _INACTIVITY_LIMIT = 1000;             // constant of maximum user inactivity time limit, this is the default cosntant but can be variable through typingLimit variable
    var _formElements = [];                   // Array of all Form Elements, this is not a DOM Elements, these are custom objects defined as { fieldName, elm,  attrs, ctrl, isValid, message }
    var _globalOptions = {                    // Angular-Validation global options, could be define by scope.$validationOptions or by validationService.setGlobalOptions()
      resetGlobalOptionsOnRouteChange: true   // do we want to reset the Global Options on a route change? True by default
    };
    var _remotePromises = [];                 // keep track of promises called and running when using the Remote validator
    var _validationSummary = [];              // Array Validation Error Summary
    var _validateOnEmpty = false;             // do we want to validate on empty field? False by default

    // watch on route change, then reset some global variables, so that we don't carry over other controller/view validations
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
      resetGlobalOptions(_globalOptions.resetGlobalOptionsOnRouteChange);
    });
    $rootScope.$on("$stateChangeStart", function (event, next, current) {
      resetGlobalOptions(_globalOptions.resetGlobalOptionsOnRouteChange);
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
      this.validateOnEmpty = false;      // do we want to always validate, even when field isn't required? False by default
      this.validRequireHowMany = "all";

      if(!!scope && !!scope.$validationOptions) {
        _globalOptions = scope.$validationOptions; // save the global options
      }

      // user could pass his own scope, useful in a case of an isolate scope
      if (!!scope && (!!_globalOptions.isolatedScope || !!_globalOptions.scope)) {
        this.scope = _globalOptions.isolatedScope || _globalOptions.scope;  // overwrite original scope (isolatedScope/scope are equivalent arguments)
        _globalOptions = mergeObjects(scope.$validationOptions, _globalOptions);                              // reuse the validationOption from original scope
      }

      // if the resetGlobalOptionsOnRouteChange doesn't exist, make sure to set it to True by default
      if(typeof _globalOptions.resetGlobalOptionsOnRouteChange === "undefined") {
        _globalOptions.resetGlobalOptionsOnRouteChange = true;
      }

      // only the angular-validation Directive can possibly reach this condition with all properties filled
      // on the other hand the angular-validation Service will `initialize()` function to initialize the same set of variables
      if (!!this.elm && !!this.validatorAttrs && !!this.ctrl && !!this.scope) {
        addToFormElementObjectList(this.elm, this.validatorAttrs, this.ctrl, this.scope);
        this.defineValidation();
      }
    };

    // list of available published public functions of this object
    validationCommon.prototype.addToValidationSummary = addToValidationSummary;                     // add an element to the $validationSummary
    validationCommon.prototype.arrayFindObject = arrayFindObject;                                   // search an object inside an array of objects
    validationCommon.prototype.defineValidation = defineValidation;                                 // define our validation object
    validationCommon.prototype.getFormElementByName = getFormElementByName;                         // get the form element custom object by it's name
    validationCommon.prototype.getFormElements = getFormElements;                                   // get the array of form elements (custom objects)
    validationCommon.prototype.getGlobalOptions = getGlobalOptions;                                 // get the global options used by all validators (usually called by the validationService)
    validationCommon.prototype.isFieldRequired = isFieldRequired;                                   // return boolean knowing if the current field is required
    validationCommon.prototype.initialize = initialize;                                             // initialize current object with passed arguments
    validationCommon.prototype.mergeObjects = mergeObjects;                                         // merge 2 javascript objects, Overwrites obj1's values with obj2's (basically Object2 as higher priority over Object1)
    validationCommon.prototype.parseBool = parseBool;                                               // parse a boolean value, string or bool
    validationCommon.prototype.removeFromValidationSummary = removeFromValidationSummary;           // remove an element from the $validationSummary
    validationCommon.prototype.removeFromFormElementObjectList = removeFromFormElementObjectList;   // remove named items from formElements list
    validationCommon.prototype.runValidationCallbackOnPromise = runValidationCallbackOnPromise;     // run a validation callback method when the promise resolve
    validationCommon.prototype.setDisplayOnlyLastErrorMsg = setDisplayOnlyLastErrorMsg;             // setter on the behaviour of displaying only the last error message
    validationCommon.prototype.setGlobalOptions = setGlobalOptions;                                 // set global options used by all validators (usually called by the validationService)
    validationCommon.prototype.updateErrorMsg = updateErrorMsg;                                     // update on screen an error message below current form element
    validationCommon.prototype.validate = validate;                                                 // validate current element

    // override some default String functions
    if(window.Element && !Element.prototype.closest) {
      Element.prototype.closest = elementPrototypeClosest;                                          // Element Closest Polyfill for the browsers that don't support it (fingers point to IE)
    }
    String.prototype.trim = stringPrototypeTrim;                                                    // extend String object to have a trim function
    String.prototype.format = stringPrototypeFormat;                                                // extend String object to have a format function like C#
    String.format = stringFormat;                                                                   // extend String object to have a format function like C#


    // return the service object
    return validationCommon;

    //----
    // Public functions declaration
    //----------------------------------

    /** Add the error to the validation summary
     * @param object self
     * @param string message: error message
     * @param bool need to translate: false by default
     */
    function addToValidationSummary(self, message, needToTranslate) {
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
        if(!!needToTranslate) {
          message = $translate.instant(message);
        }
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
        if (!!form && !!form.$name) {
          var formName = form.$name.indexOf('.') >= 0 ? form.$name.split('.')[1] : form.$name;
          var ctrlForm = (!!_globalOptions.controllerAs[formName]) ? _globalOptions.controllerAs[formName] : self.elm.controller()[formName];
          if(!!ctrlForm) {
            ctrlForm.$validationSummary = arrayFindObjects(_validationSummary, 'formName', form.$name);
          }
        }
      }

      return _validationSummary;
    }

    /** Define our validation object
     * @return object self
     */
    function defineValidation() {
      var self = this;
      var customUserRegEx = {};
      self.validators = [];        // reset the global validators

      // analyze the possible element attributes
      self = analyzeElementAttributes(self);

      // get the rules(or validation), inside directive it's named (validation), inside service(rules)
      var rules = self.validatorAttrs.rules || self.validatorAttrs.validation;

      // We first need to see if the validation holds a custom user regex, if it does then deal with it first
      // So why deal with it separately? Because a Regex might hold pipe '|' and so we don't want to mix it with our regular validation pipe
      if(rules.indexOf("pattern=/") >= 0) {
        var matches = rules.match(/pattern=(\/(?:(?!:alt).)*\/[igm]*)(:alt=(.*))?/);
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
        self.bFieldRequired = (rules.indexOf("required") >= 0);

        // loop through all validators of the element
        for (var i = 0, ln = validations.length; i < ln; i++) {
          // check if user provided an alternate text to his validator (validator:alt=Alternate Text)
          var posAltText = validations[i].indexOf("alt=");
          var hasAltText = posAltText >= 0;
          var params = [];

          // alternate text might have the character ":" inside it, so we need to compensate
          // since altText is always at the end, we can before the altText and add back this untouched altText to our params array
          if(hasAltText) {
            params = validations[i].substring(0,posAltText-1).split(':'); // split before altText, so we won't touch it
            params.push(validations[i].substring(posAltText));                // add back the altText to our split params array
          }else {
            // params split will be:: [0]=rule, [1]=ruleExtraParams OR altText, [2] altText
            params = validations[i].split(':');
          }

          self.validators[i] = ValidationRules.getElementValidators({
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
     * @param string element input name
     * @return array object elements
     */
    function getFormElementByName(elmName) {
      return arrayFindObject(_formElements, 'fieldName', elmName);
    }

    /** Return all Form elements
     * @param string form name
     * @return array object elements
     */
    function getFormElements(formName) {
      if(!!formName) {
        return arrayFindObjects(_formElements, 'formName', formName);
      }
      return _formElements;
    }

    /** Get global options used by all validators
     * @return object global options
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
     * @param element input name to remove
     */
    function removeFromFormElementObjectList(elmName) {
      var index = arrayFindObjectIndex(_formElements, 'fieldName', elmName); // find index of object in our array
      if (index >= 0) {
        _formElements.splice(index, 1);
      }
    }

    /** Remove an element from the $validationSummary array
     * @param string elmName: element name
     * @param object validationSummary
     */
    function removeFromValidationSummary(elmName, validationSummaryObj) {
      var self = this;
      var form = getElementParentForm(elmName, self);                         // find the parent form (only found if it has a name)
      var vsObj = validationSummaryObj || _validationSummary;

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
          if(!!_globalOptions.controllerAs[formName]) {
            _globalOptions.controllerAs[formName].$validationSummary = arrayFindObjects(_validationSummary, 'formName', form.$name);
          }
        }
      }


      return _validationSummary;
    }

    /** Evaluate a function name passed as string and run it from the scope.
     * The function name could be passed with/without brackets "()", in any case we will run the function
     * @param object self object
     * @param string function passed as a string
     * @param mixed result
     */
    function runEvalScopeFunction(self, fnString) {
      var result;

      // Find if our function has the brackets "()"
      // if yes then run it through $eval else find it in the scope and then run it
      if(/\({1}.*\){1}/gi.test(fnString)) {
        result = self.scope.$eval(fnString);
      }else {
        var fct = objectFindById(self.scope, fnString, '.');
        if(typeof fct === "function") {
          result = fct();
        }
      }
      return result;
    }

    /** Run a validation callback function once the promise return
    * @param object validation promise
     * @param string callback function name (could be with/without the brackets () )
     */
    function runValidationCallbackOnPromise(promise, callbackFct) {
      var self = this;

      if(typeof promise.then === "function") {
        promise.then(function() {
          runEvalScopeFunction(self, callbackFct);
        });
      }
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
      * @param object arguments that could be passed to the function
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
      errorMsg = errorMsg.trim();

      // get the name attribute of current element, make sure to strip dirty characters, for example remove a <input name="options[]"/>, we need to strip the "[]"
      // also replace any possible '.' inside the input name by '-'
      var elmInputName = elmName.replace(/[|&;$%@"<>()+,\[\]\{\}]/g, '').replace(/\./g, '-');
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
      if (!_globalOptions.hideErrorUnderInputs && !!attrs && !attrs.isValid && (isSubmitted || self.ctrl.$dirty || self.ctrl.$touched || self.ctrl.revalidateCalled)) {
        (errorElm.length > 0) ? errorElm.html(errorMsg) : elm.after('<div class="validation validation-' + elmInputName + ' text-danger">' + errorMsg + '</div>');
      } else {
        errorElm.html('');  // element is pristine or no validation applied, error message has to be blank
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
      var isConditionValid = true;
      var isFieldValid = true;
      var nbValid = 0;
      var validator;
      var validatedObject = {};

      // make an object to hold the message so that we can reuse the object by reference
      // in some of the validation check (for example "matching" and "remote")
      var validationElmObj = {
        message: ''
      }

      // to make proper validation, our element value cannot be an undefined variable (we will at minimum make it an empty string)
      // For example, in some particular cases "undefined" returns always True on regex.test() which is incorrect especially on max_len:x
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
      var rules = self.validatorAttrs.rules || self.validatorAttrs.validation;

      // loop through all validators (could be multiple)
      for (var j = 0, jln = self.validators.length; j < jln; j++) {
        validator = self.validators[j];

        // When AutoDetect it will auto-detect the type and rewrite the conditions or regex pattern, depending on type found
        if (validator.type === "autoDetect") {
          validator = validatorAutoDetectType(validator, strValue);
        }

        // get the ngDisabled attribute if found
        var elmAttrNgDisabled = (!!self.attrs) ? self.attrs.ngDisabled : self.validatorAttrs.ngDisabled;

        // now that we have a Validator type, we can now validate our value
        // there is multiple type that can influence how the value will be validated
        switch(validator.type) {
          case "conditionalDate":
            isConditionValid = validateConditionalDate(strValue, validator, rules);
            break;
          case "conditionalNumber":
            isConditionValid = validateConditionalNumber(strValue, validator);
            break;
          case "javascript":
            isConditionValid = validateCustomJavascript(strValue, validator, self, formElmObj, showError, validationElmObj);
            break;
          case "matching":
            isConditionValid = validateMatching(strValue, validator, self, validationElmObj);
            break;
          case "remote":
            isConditionValid = validateRemote(strValue, validator, self, formElmObj, showError, validationElmObj);
            break;
          default:
            isConditionValid = validateWithRegex(strValue, validator, rules, self);
            break;
        }

        // not required and not filled is always valid & 'disabled', 'ng-disabled' elements should always be valid
        if ((!self.bFieldRequired && !strValue && !_validateOnEmpty) || (!!self.elm.prop("disabled") || !!self.scope.$eval(elmAttrNgDisabled))) {
          isConditionValid = true;
        }

        if (!isConditionValid) {
          isFieldValid = false;

          // run $translate promise, use closures to keep access to all necessary variables
          (function (formElmObj, isConditionValid, validator) {
            var msgToTranslate = validator.message;
            var errorMessageSeparator = _globalOptions.errorMessageSeparator || ' ';
            if (!!validator.altText && validator.altText.length > 0) {
              msgToTranslate = validator.altText.replace("alt=", "");
            }

            var trsltPromise = $translate(msgToTranslate);
            formElmObj.translatePromise = trsltPromise;
            formElmObj.validator = validator;

            trsltPromise.then(function (translation) {
              // if user is requesting to see only the last error message, we will use '=' instead of usually concatenating with '+='
              // then if validator rules has 'params' filled, then replace them inside the translation message (foo{0} {1}...), same syntax as String.format() in C#
              if (validationElmObj.message.length > 0 && _globalOptions.displayOnlyLastErrorMsg) {
                validationElmObj.message = errorMessageSeparator + ((!!validator && !!validator.params) ? String.format(translation, validator.params) : translation);
              } else {
                validationElmObj.message += errorMessageSeparator + ((!!validator && !!validator.params) ? String.format(translation, validator.params) : translation);
              }
              addToValidationAndDisplayError(self, formElmObj, validationElmObj.message, isFieldValid, showError);
            })
            ["catch"](function (data) {
              // error caught:
              // alternate text might not need translation if the user sent his own custom message or is already translated
              // so just send it directly into the validation summary.
              if (!!validator.altText && validator.altText.length > 0) {
                // if user is requesting to see only the last error message
                if (validationElmObj.message.length > 0 && _globalOptions.displayOnlyLastErrorMsg) {
                  validationElmObj.message = errorMessageSeparator + msgToTranslate;
                } else {
                  validationElmObj.message += errorMessageSeparator + msgToTranslate;
                }
                addToValidationAndDisplayError(self, formElmObj, validationElmObj.message, isFieldValid, showError);
              } else {
                throw String.format("Could not translate: '{0}'. Please check your Angular-Translate $translateProvider configuration.", data);
              }
            });
          })(formElmObj, isConditionValid, validator);
        } // if(!isConditionValid)

        if(isConditionValid) {
          nbValid++;
        }

        // when user want the field to become valid as soon as we have 1 validator passing
        if(self.validRequireHowMany == nbValid && !!isConditionValid) {
          isFieldValid = true;
          break;
        }
      }   // for() loop

      // only log the invalid message in the $validationSummary
      if (isConditionValid) {
        addToValidationSummary(self, '');
        self.updateErrorMsg('', { isValid: isConditionValid });
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
     * @param object scope
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
     * @param bool is field valid?
     * @param bool showError
     */
    function addToValidationAndDisplayError(self, formElmObj, message, isFieldValid, showError) {
      // trim any white space
      message = message.trim();

      // if validation is cancelled, then erase error message
      if(!!formElmObj && formElmObj.isValidationCancelled === true) {
        message = '';
      }

      // log the invalid message in the $validationSummary
      // that is if the preValidationSummary is set to True, non-existent or we simply want to display error)
      if(!!_globalOptions.preValidateValidationSummary || typeof _globalOptions.preValidateValidationSummary === "undefined" || showError) {
        addToValidationSummary(formElmObj, message);
      }

      // change the Form element object boolean flag from the `formElements` variable, used in the `checkFormValidity()`
      if (!!formElmObj) {
        //formElmObj.message = message;
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
        self.updateErrorMsg(message, { isValid: isFieldValid, obj: formElmObj });
      } else if (!!formElmObj && formElmObj.isValid) {
        addToValidationSummary(formElmObj, '');
      }
    }

    /** Analyse the certain attributes that the element can have or could be passed by global options
     * @param object self
     * @return self
     */
    function analyzeElementAttributes(self) {
      // debounce (alias of typingLimit) timeout after user stop typing and validation comes in play
      self.typingLimit = _INACTIVITY_LIMIT;
      if (self.validatorAttrs.hasOwnProperty('debounce')) {
        self.typingLimit = parseInt(self.validatorAttrs.debounce, 10);
      } else if (self.validatorAttrs.hasOwnProperty('typingLimit')) {
        self.typingLimit = parseInt(self.validatorAttrs.typingLimit, 10);
      } else if (!!_globalOptions && _globalOptions.hasOwnProperty('debounce')) {
        self.typingLimit = parseInt(_globalOptions.debounce, 10);
      }

      // how many Validators it needs to pass for the field to become valid, "all" by default
      self.validRequireHowMany = self.validatorAttrs.hasOwnProperty('validRequireHowMany')
        ? self.validatorAttrs.validRequireHowMany
        : _globalOptions.validRequireHowMany;

      // do we want to validate on empty field? Useful on `custom` and `remote`
      _validateOnEmpty = self.validatorAttrs.hasOwnProperty('validateOnEmpty')
        ? parseBool(self.validatorAttrs.validateOnEmpty)
        : _globalOptions.validateOnEmpty;

      return self;
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

    /** From a javascript plain form object, find its equivalent Angular object
     * @param object formObj
     * @param object self
     * @return object angularParentForm or null
     */
    function findAngularParentFormInScope(formObj, self) {
      var formName = (!!formObj) ? formObj.getAttribute("name") : null;

      if (!!formObj && !!formName) {
        parentForm = (!!_globalOptions && !!_globalOptions.controllerAs && formName.indexOf('.') >= 0)
          ? objectFindById(self.scope, formName, '.')
          : self.scope[formName];

        if(!!parentForm) {
          if (typeof parentForm.$name === "undefined") {
            parentForm.$name = formName; // make sure it has a $name, since we use that variable later on
          }
          return parentForm;
        }
      }

      return null;
    }

    /** Get the element's parent Angular form (if found)
     * @param string: element input name
     * @param object self
     * @return object scope form
     */
    function getElementParentForm(elmName, self) {
      // get the parentForm directly by it's formName if it was passed in the global options
      if(!!_globalOptions && !!_globalOptions.formName) {
        var parentForm = document.querySelector('[name="'+_globalOptions.formName+'"]');
        if(!!parentForm) {
          parentForm.$name = _globalOptions.formName; // make sure the parentForm as a $name for later usage
          return parentForm;
        }
      }

      // from the element passed, get his parent form (this doesn't work with every type of element, for example it doesn't work with <div> or special angular element)
      var forms = document.getElementsByName(elmName);
      var parentForm = null;

      for (var i = 0; i < forms.length; i++) {
        var form = forms[i].form;
        var angularParentForm = findAngularParentFormInScope(form, self);
        if(!!angularParentForm) {
          return angularParentForm;
        }
      }

      // if we haven't found a form yet, then we have a special angular element, let's try with .closest
      if(!form) {
        var element = document.querySelector('[name="'+elmName+'"]');
        if(!!element) {
          var form = element.closest("form");
          var angularParentForm = findAngularParentFormInScope(form, self);
          if(!!angularParentForm) {
            return angularParentForm;
          }
        }
      }

      // falling here with a form name but without a form object found in the scope is often due to isolate scope
      // we can hack it and define our own form inside this isolate scope, in that way we can still use something like: isolateScope.form1.$validationSummary
      if (!!form) {
        var formName = (!!form) ? form.getAttribute("name") : null;
        if(!!formName) {
          var obj = { $name: formName, specialNote: 'Created by Angular-Validation for Isolated Scope usage' };

          if (!!_globalOptions && !!_globalOptions.controllerAs && formName.indexOf('.') >= 0) {
            var formSplit = formName.split('.');
            return self.scope[formSplit[0]][formSplit[1]] = obj
          }
          return self.scope[formName] = obj;
        }
      }
      return null;
    }

    /** Check if the given argument is numeric
     * @param mixed n
     * @return bool
     */
    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    /** Find a property inside an object.
     * If a delimiter is passed as argument, we will split the search ID before searching
     * @param object: source object
     * @param string: searchId
     * @return mixed: property found
     */
    function objectFindById(sourceObject, searchId, delimiter) {
      var split = (!!delimiter) ? searchId.split(delimiter) : searchId;

      for (var k = 0, kln = split.length; k < kln; k++) {
        if(!!sourceObject[split[k]]) {
          sourceObject = sourceObject[split[k]];
        }
      }
      return sourceObject;
    }

    /** Parse a boolean value, we also want to parse on string values
     * @param string/int value
     * @return bool
     */
    function parseBool(value) {
      if(typeof value === "boolean" || typeof value === "number") {
        return (value === true || value === 1);
      }
      else if (typeof value === "string") {
         value = value.replace(/^\s+|\s+$/g, "").toLowerCase();
         if (value === "true" || value === "1" || value === "false" || value === "0")
           return (value === "true" || value === "1");
      }
      return; // returns undefined
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

    /** Reset all the available Global Options of Angular-Validation
     * @param bool do a Reset?
     */
    function resetGlobalOptions(doReset) {
      if (doReset) {
        _globalOptions = {
          displayOnlyLastErrorMsg: false,     // reset the option of displaying only the last error message
          errorMessageSeparator: ' ',         // separator between each error messages (when multiple errors exist)
          hideErrorUnderInputs: false,        // reset the option of hiding error under element
          preValidateFormElements: false,     // reset the option of pre-validate all form elements, false by default
          preValidateValidationSummary: true, // reset the option of pre-validate all form elements, false by default
          isolatedScope: null,                // reset used scope on route change
          scope: null,                        // reset used scope on route change
          validateOnEmpty: false,             // reset the flag of Validate Always
          validRequireHowMany: 'all',         // how many Validators it needs to pass for the field to become valid, "all" by default
          resetGlobalOptionsOnRouteChange: true
        };
        _formElements = [];                   // array containing all form elements, valid or invalid
        _validationSummary = [];              // array containing the list of invalid fields inside a validationSummary
      }
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
        case '<': result = (value1 < value2); break;
        case '<=': result = (value1 <= value2); break;
        case '>': result = (value1 > value2); break;
        case '>=': result = (value1 >= value2); break;
        case '!=':
        case '<>': result = (value1 != value2); break;
        case '!==': result = (value1 !== value2); break;
        case '=':
        case '==': result = (value1 == value2); break;
        case '===': result = (value1 === value2); break;
        default: result = false; break;
      }
      return result;
    }

    /** Element Closest Polyfill for the browsers that don't support it (fingers point to IE)
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
     */
    function elementPrototypeClosest() {
      Element.prototype.closest =
        function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i,
            el = this;

        do {
          i = matches.length;
          while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement));
        return el;
      };
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
        return (typeof args[number] !== "undefined") ? args[number] : match;
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
        return (typeof args[number] !== "undefined") ? args[number] : match;
      });
    }

    /** Validating a Conditional Date, user want to valid if his date is smaller/higher compare to another.
     * @param string value
     * @param object validator
     * @param object rules
     * @return bool isValid
     */
    function validateConditionalDate(strValue, validator, rules) {
      var isValid = true;
      var isWellFormed = isValid = false;

      // 1- make sure Date is well formed (if it's already a Date object then it's already good, else check that with Regex)
      if((strValue instanceof Date)) {
        isWellFormed = true;
      }else {
        // run the Regex test through each iteration, if required (\S+) and is null then it's invalid automatically
        var regex = new RegExp(validator.pattern, validator.patternFlag);
        isWellFormed = ((!validator.pattern || validator.pattern.toString() === "/\\S+/" || (!!rules && validator.pattern === "required")) && strValue === null) ? false : regex.test(strValue);
      }

      // 2- date is well formed, then go ahead with conditional date check
      if (isWellFormed) {
        // For Date comparison, we will need to construct a Date Object that follows the ECMA so then it could work in all browser
        // Then convert to timestamp & finally we can compare both dates for filtering
        var dateType = validator.dateType;                   // date type (ISO, EURO, US-SHORT, US-LONG)
        var timestampValue = (strValue instanceof Date) ? strValue : parseDate(strValue, dateType).getTime(); // our input value parsed into a timestamp

        // if 2 params, then it's a between condition
        if (validator.params.length == 2) {
          // this is typically a "between" condition, a range of number >= and <=
          var timestampParam0 = parseDate(validator.params[0], dateType).getTime();
          var timestampParam1 = parseDate(validator.params[1], dateType).getTime();
          var isValid1 = testCondition(validator.condition[0], timestampValue, timestampParam0);
          var isValid2 = testCondition(validator.condition[1], timestampValue, timestampParam1);
          isValid = (isValid1 && isValid2);
        } else {
          // else, 1 param is a simple conditional date check
          var timestampParam = parseDate(validator.params[0], dateType).getTime();
          isValid = testCondition(validator.condition, timestampValue, timestampParam);
        }
      }

      return isValid;
    }

    /** Validating a Conditional Number, user want to valid if his number is smaller/higher compare to another.
     * @param string value
     * @param object validator
     * @return bool isValid
     */
    function validateConditionalNumber(strValue, validator) {
      var isValid = true;

      // if 2 params, then it's a between condition
      if (validator.params.length == 2) {
        // this is typically a "between" condition, a range of number >= and <=
        var isValid1 = testCondition(validator.condition[0], parseFloat(strValue), parseFloat(validator.params[0]));
        var isValid2 = testCondition(validator.condition[1], parseFloat(strValue), parseFloat(validator.params[1]));
        isValid = (isValid1 && isValid2);
      } else {
        // else, 1 param is a simple conditional number check
        isValid = testCondition(validator.condition, parseFloat(strValue), parseFloat(validator.params[0]));
      }

      return isValid;
    }

    /** Make a Custom Javascript Validation, this should return a boolean or an object as { isValid: bool, message: msg }
     * The argument of `validationElmObj` is mainly there only because it's passed by reference (pointer reference) and
     * by the time the $translate promise is done with the translation then the promise in our function will have the latest error message.
     * @param string value
     * @param object validator
     * @param object self
     * @param object formElmObj
     * @param bool showError
     * @param object element validation object (passed by reference)
     * @return bool isValid
     */
    function validateCustomJavascript(strValue, validator, self, formElmObj, showError, validationElmObj) {
      var isValid = true;
      var missingErrorMsg = "Custom Javascript Validation requires an error message defined as 'alt=' in your validator or defined in your custom javascript function as { isValid: bool, message: 'your error' }"
      var invalidResultErrorMsg = 'Custom Javascript Validation requires a declared function (in your Controller), please review your code.';

      if (!!strValue || !!_validateOnEmpty) {
        var fct = null;
        var fname = validator.params[0];
        var result = runEvalScopeFunction(self, fname);

        // analyze the result, could be a boolean or object type, anything else will throw an error
        if (typeof result === "boolean") {
          isValid = (!!result);
        }
        else if (typeof result === "object") {
          isValid = (!!result.isValid);
        }
        else {
          throw invalidResultErrorMsg;
        }

        if (isValid === false) {
          formElmObj.isValid = false;

          // is field is invalid and we have an error message given, then add it to validationSummary and display error
          // use of $timeout to make sure we are always at the end of the $digest
          // if user passed the error message from inside the custom js function, $translate would come and overwrite this error message and so being sure that we are at the end of the $digest removes this issue.
          $timeout(function() {
            var errorMsg = validationElmObj.message + ' ';
            if(!!result.message) {
              errorMsg += result.message || validator.altText;
            }
            if(errorMsg === ' ' && !!validator.altText) {
              errorMsg += validator.altText;
            }
            if(errorMsg === ' ') {
              throw missingErrorMsg;
            }

            addToValidationAndDisplayError(self, formElmObj, errorMsg, false, showError);
          });
        }
        else if (isValid === true) {
          // if field is valid from the remote check (isValid) and from the other validators check (isFieldValid)
          // clear up the error message and make the field directly as Valid with $setValidity since remote check arrive after all other validators check
          formElmObj.isValid = true;
          addToValidationAndDisplayError(self, formElmObj, '', true, showError);
        }

        if(typeof result === "undefined") {
          throw invalidResultErrorMsg;
        }
      }

      return isValid;
    }

    /** Validating a match input checking, it could a check to be the same as another input or even being different.
     * The argument of `validationElmObj` is mainly there only because it's passed by reference (pointer reference) and
     * by the time the $translate promise is done with the translation then the promise in our function will have the latest error message.
     * @param string value
     * @param object validator
     * @param object self
     * @param object element validation object (passed by reference)
     * @return bool isValid
     */
    function validateMatching(strValue, validator, self, validationElmObj) {
      var isValid = true;

      // get the element 'value' ngModel to compare to (passed as params[0], via an $eval('ng-model="modelToCompareName"')
      // for code purpose we'll name the other parent element "parent..."
      // and we will name the current element "matching..."
      var parentNgModel = validator.params[0];
      var parentNgModelVal = self.scope.$eval(parentNgModel);
      var otherElm = angular.element(document.querySelector('[name="'+parentNgModel+'"]'));
      var matchingValidator = validator;  // keep reference of matching confirmation validator
      var matchingCtrl = self.ctrl;       // keep reference of matching confirmation controller
      var formElmMatchingObj = getFormElementByName(self.ctrl.$name);

      isValid = (testCondition(validator.condition, strValue, parentNgModelVal) && !!strValue);

      // if element to compare against has a friendlyName or if matching 2nd argument was passed, we will use that as a new friendlyName
      // ex.: <input name='input1' friendly-name='Password1'/> :: we would use the friendlyName of 'Password1' not input1
      // or <input name='confirm_pass' validation='match:input1,Password2' /> :: we would use Password2 not input1
      if(!!otherElm && !!otherElm.attr('friendly-name')) {
        validator.params[1] = otherElm.attr('friendly-name');
      }
      else if(validator.params.length > 1)  {
        validator.params[1] = validator.params[1];
      }

      // Watch for the parent ngModel, if it change we need to re-validate the child (confirmation)
      self.scope.$watch(parentNgModel, function(newVal, oldVal) {
        var isWatchValid = testCondition(matchingValidator.condition, matchingCtrl.$viewValue, newVal);

        // only inspect on a parent input value change
        if(newVal !== oldVal) {
          // If Valid then erase error message ELSE make matching field Invalid
          if(isWatchValid) {
            addToValidationAndDisplayError(self, formElmMatchingObj, '', true, true);
          }else {
            formElmMatchingObj.isValid = false;
            var msgToTranslate = matchingValidator.message;
            if (!!matchingValidator.altText && matchingValidator.altText.length > 0) {
              msgToTranslate = matchingValidator.altText.replace("alt=", "");
            }
            $translate(msgToTranslate).then(function (translation) {
              var errorMessageSeparator = _globalOptions.errorMessageSeparator || ' ';
              validationElmObj.message = errorMessageSeparator + ((!!matchingValidator && !!matchingValidator.params) ? String.format(translation, matchingValidator.params) : translation);
              addToValidationAndDisplayError(self, formElmMatchingObj, validationElmObj.message, isWatchValid, true);
            });
          }
          matchingCtrl.$setValidity('validation', isWatchValid); // change the validity of the matching input
        }
      }, true); // .$watch()

      return isValid;
    }

    /** Make an AJAX Remote Validation with a backend server, this should return a promise with the result as a boolean or a { isValid: bool, message: msg }
     * The argument of `validationElmObj` is mainly there only because it's passed by reference (pointer reference) and
     * by the time the $translate promise is done with the translation then the promise in our function will have the latest error message.
     * @param string value
     * @param object validator
     * @param object self
     * @param object formElmObj
     * @param bool showError
     * @param object element validation object (passed by reference)
     * @return bool isValid
     */
    function validateRemote(strValue, validator, self, formElmObj, showError, validationElmObj) {
      var isValid = true;
      var missingErrorMsg = "Remote Javascript Validation requires an error message defined as 'alt=' in your validator or defined in your custom remote function as { isValid: bool, message: 'your error' }"
      var invalidResultErrorMsg = 'Remote Validation requires a declared function (in your Controller) which also needs to return a Promise, please review your code.';

      if ((!!strValue && !!showError) || !!_validateOnEmpty) {
        self.ctrl.$processing = true; // $processing can be use in the DOM to display a remote processing message to the user

        var fct = null;
        var fname = validator.params[0];
        var promise = runEvalScopeFunction(self, fname);

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
              _remotePromises.pop();                // remove the last promise from array list of promises
              self.ctrl.$processing = false;        // finished resolving, no more pending

              var errorMsg = validationElmObj.message + ' ';

              // analyze the result, could be a boolean or object type, anything else will throw an error
              if (typeof result === "boolean") {
                isValid = (!!result);
              }
              else if (typeof result === "object") {
                isValid = (!!result.isValid);
              }
              else {
                throw invalidResultErrorMsg;
              }

              if (isValid === false) {
                formElmObj.isValid = false;
                errorMsg += result.message || altText;
                if(errorMsg === ' ') {
                  throw missingErrorMsg;
                }

                // is field is invalid and we have an error message given, then add it to validationSummary and display error
                addToValidationAndDisplayError(self, formElmObj, errorMsg, false, showError);
              }
              else if (isValid === true) {
                // if field is valid from the remote check (isValid) and from the other validators check (isFieldValid)
                // clear up the error message and make the field directly as Valid with $setValidity since remote check arrive after all other validators check
                formElmObj.isValid = true;
                self.ctrl.$setValidity('remote', true);
                addToValidationAndDisplayError(self, formElmObj, '', true, showError);
              }
            });
          })(validator.altText);
        } else {
          throw invalidResultErrorMsg;
        }
      }

      return isValid;
    }

    /** Validating through a regular regex pattern checking
     * @param string value
     * @param object validator
     * @param object rules
     * @param object self
     * @return bool isValid
     */
    function validateWithRegex(strValue, validator, rules, self) {
      var isValid = true;

      // get the ngDisabled attribute if found
      var elmAttrNgDisabled = (!!self.attrs) ? self.attrs.ngDisabled : self.validatorAttrs.ngDisabled;

      // a 'disabled' element should always be valid, there is no need to validate it
      if (!!self.elm.prop("disabled") || !!self.scope.$eval(elmAttrNgDisabled)) {
        isValid = true;
      } else {
        // before running Regex test, we'll make sure that an input of type="number" doesn't hold invalid keyboard chars, if true skip Regex
        if (typeof strValue === "string" && strValue === "" && !!self.elm.prop('type') && self.elm.prop('type').toUpperCase() === "NUMBER") {
          isValid = false;
        } else {
          // run the Regex test through each iteration, if required (\S+) and is null then it's invalid automatically
          var regex = new RegExp(validator.pattern, validator.patternFlag);
          isValid = ((!validator.pattern || validator.pattern.toString() === "/\\S+/" || (!!rules && validator.pattern === "required")) && strValue === null) ? false : regex.test(strValue);
        }
      }

      return isValid;
    }

    /** AutoDetect type is a special case and will detect if the given value is of type numeric or not.
     * then it will rewrite the conditions or regex pattern, depending on type found
     * @param object validator
     * @return object rewritten validator
     */
    function validatorAutoDetectType(validator, strValue) {
      if (isNumeric(strValue)) {
        return {
          condition: validator.conditionNum,
          message: validator.messageNum,
          params: validator.params,
          type: "conditionalNumber"
        };
      }else {
        return {
          pattern: validator.patternLength,
          message: validator.messageLength,
          params: validator.params,
          type: "regex"
        };
      }

      return {};
    }

  }]); // validationCommon service