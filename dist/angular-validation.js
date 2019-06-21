/**
 * Angular-Validation Directive and Service (ghiscoding)
 * http://github.com/ghiscoding/angular-validation
 * @author: Ghislain B.
 * @version: 1.5.28
 * @license: MIT
 * @build: Thu Jun 20 2019 21:18:15 GMT-0400 (Eastern Daylight Time)
 */
/**
 * Angular-Validation Directive (ghiscoding)
 * https://github.com/ghiscoding/angular-validation
 *
 * @author: Ghislain B.
 * @started: 2014-02-04
 *
 * @desc: If a field becomes invalid, the text inside the error <span> or <div> will show up because the error string gets filled
 * Though when the field becomes valid then the error message becomes an empty string,
 * it will be transparent to the user even though the <span> still exist but becomes invisible since the text is empty.
 *
 */
 angular
  .module('ghiscoding.validation', ['pascalprecht.translate'])
  .directive('validation', ['$q', '$timeout', 'ValidationCommon', function($q, $timeout, ValidationCommon) {
    return {
      restrict: "A",
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        // create an object of the common validation
        var commonObj = new ValidationCommon(scope, elm, attrs, ctrl);
        var _arrayErrorMessage = '';
        var _promises = [];
        var _timer;
        var _watchers = [];
        var _globalOptions = commonObj.getGlobalOptions();

        // Possible element attributes
        var _elmName = attrs.name;
        var _validationCallback = (attrs.hasOwnProperty('validationCallback')) ? attrs.validationCallback : null;
        var _validateOnEmpty = (attrs.hasOwnProperty('validateOnEmpty')) ? commonObj.parseBool(attrs.validateOnEmpty) : !!_globalOptions.validateOnEmpty;

        //-- Possible validation-array attributes
        // on a validation array, how many does it require to be valid?
        // As soon as 'one' is valid, or does it need 'all' array values to make the input valid?
        var _validArrayRequireHowMany = (attrs.hasOwnProperty('validArrayRequireHowMany')) ? attrs.validArrayRequireHowMany : "one";
        var _validationArrayObjprop = (attrs.hasOwnProperty('validationArrayObjprop')) ? attrs.validationArrayObjprop : null;

        // construct the functions, it's just to make the code cleaner and put the functions at bottom
        var construct = {
          attemptToValidate: attemptToValidate,
          cancelValidation : cancelValidation
        }

        // create & save watcher inside an array in case we want to deregister it when removing a validator
        _watchers.push({ elmName: _elmName, watcherHandler: createWatch() });

        // watch the `disabled` attribute for changes
        // if it become disabled then skip validation else it becomes enable then we need to revalidate it
        attrs.$observe("disabled", function(disabled) {
          var isDisabled = (disabled === "")
            ? true
            : (typeof disabled === "boolean") ? disabled
              : (typeof disabled !== "undefined") ? scope.$eval(disabled) : false;

          if (isDisabled === true) {
            // Turn off validation when element is disabled & remove it from validation summary
            cancelValidation();
            commonObj.removeFromValidationSummary(_elmName);
          } else {
            // revalidate & re-attach the onBlur event
            revalidateAndAttachOnBlur();
          }
        });

        // if DOM element gets destroyed, we need to cancel validation, unbind onBlur & remove it from $validationSummary
        elm.on('$destroy', function() {
          cancelAndUnbindValidation();
        });

        // watch for a validation attribute changing to empty, if that is the case, unbind everything from it
        scope.$watch(function() {
          return elm.attr('validation');
        }, function(validation) {
          if(typeof validation === "undefined" || validation === '') {
            // if validation gets empty, we need to cancel validation, unbind onBlur & remove it from $validationSummary
            cancelAndUnbindValidation();
          }else {
            // If validation attribute gets filled/re-filled (could be by interpolation)
            //  we need to redefine the validation so that we can grab the new "validation" element attribute
            // and finally revalidate & re-attach the onBlur event
            commonObj.defineValidation();
            revalidateAndAttachOnBlur();

            // if watcher not already exist, then create & save watcher inside an array in case we want to deregister it later
            var foundWatcher = commonObj.arrayFindObject(_watchers, 'elmName', ctrl.$name);
            if(!foundWatcher) {
              _watchers.push({ elmName: _elmName, watcherHandler: createWatch() });
            }
          }
        });

        // attach the onBlur event handler on the element
        elm.bind('blur', blurHandler);

        // attach the angularValidation.revalidate event handler on the scope
        scope.$on('angularValidation.revalidate', function(event, args){
          if (args == ctrl.$name)
          {
            ctrl.revalidateCalled = true;
            var value = ctrl.$modelValue;

            var formElmObj = commonObj.getFormElementByName(ctrl.$name);
            if (!!formElmObj && formElmObj.hasOwnProperty("isValidationCancelled")) {
              // attempt to validate & run validation callback if user requested it
              var validationPromise = attemptToValidate(value);
              if(!!_validationCallback) {
                commonObj.runValidationCallbackOnPromise(validationPromise, _validationCallback);
              }
            }
            else {
              ctrl.$setValidity('validation', true);
            }
          }
        });

        //----
        // Private functions declaration
        //----------------------------------

        /** Validator function to attach to the element, this will get call whenever the input field is updated
         *  and is also customizable through the (typing-limit) for which inactivity this.timer will trigger validation.
         * @param string value: value of the input field
         * @param int typingLimit: when user stop typing, in how much time it will start validating
         * @return object validation promise
         */
        function attemptToValidate(value, typingLimit) {
          var deferred = $q.defer();
          var isValid = false;

          // get the waiting delay time if passed as argument or get it from common Object
          var waitingLimit = (typeof typingLimit !== "undefined") ? typingLimit : commonObj.typingLimit;

          // get the form element custom object and use it after
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);

          // if the input value is an array (like a 3rd party addons) then attempt to validate
          // by exploding the array into individual input values and then validate them one value by one
          if(Array.isArray(value)) {
            // reset the promises array
            _promises = [];
            _arrayErrorMessage = '';
            waitingLimit = 0;

            // If we get a filled array, we will explode the array and try to validate each input value independently and
            // Else when array is or become empty, we still want to validate it but without waiting time,
            //   a "required" validation needs to be invalid right away.
            // NOTE: because most 3rd party addons support AngularJS older than 1.3, the $touched property on the element is most often not implemented
            //   but is required for Angular-Validation to properly display error messages and I have to force a $setTouched and by doing so force to show error message instantly on screen.
            //   unless someone can figure out a better approach that is universal to all addons. I could in fact also use $dirty but even that is most often not implement by adons either.
            if(value.length > 0) {
              // make the element as it was touched for CSS, only works in AngularJS 1.3+
              if (typeof formElmObj.ctrl.$setTouched === "function") {
                formElmObj.ctrl.$setTouched();
              }
              return explodeArrayAndAttemptToValidate(value, typeof value);
            }else {
              waitingLimit = 0;
            }
          }

          // if a field holds invalid characters which are not numbers inside an `input type="number"`, then it's automatically invalid
          // we will still call the `.validate()` function so that it shows also the possible other error messages
          if(!!value && !!value.badInput) {
            return invalidateBadInputField();
          }

          // pre-validate without any events just to pre-fill our validationSummary with all field errors
          // passing False as the 2nd argument to hide errors from being displayed on screen
          commonObj.validate(value, false);

          // if field is not required and his value is empty, cancel validation and exit out
          if(!commonObj.isFieldRequired() && !_validateOnEmpty && (value === "" || value === null || typeof value === "undefined")) {
            cancelValidation();
            deferred.resolve({ isFieldValid: true, formElmObj: formElmObj, value: value });
            return deferred.promise;
          }else if(!!formElmObj) {
            formElmObj.isValidationCancelled = false;
          }

          // invalidate field before doing any validation
          if((value !== "" && value !== null && typeof value !== "undefined") || commonObj.isFieldRequired() || _validateOnEmpty) {
            ctrl.$setValidity('validation', false);
          }

          // select(options) will be validated on the spot
          if(elm.prop('tagName').toUpperCase() === "SELECT") {
            isValid = commonObj.validate(value, true);
            ctrl.$setValidity('validation', isValid);
            deferred.resolve({ isFieldValid: isValid, formElmObj: formElmObj, value: value });
            return deferred.promise;
          }

          // onKeyDown event is the default of Angular, no need to even bind it, it will fall under here anyway
          // in case the field is already pre-filled, we need to validate it without looking at the event binding
          if(typeof value !== "undefined") {
            // when no timer, validate right away without a $timeout. This seems quite important on the array input value check
            if(typingLimit === 0) {
              isValid = commonObj.validate(value, true);
              scope.$evalAsync(ctrl.$setValidity('validation', isValid ));
              deferred.resolve({ isFieldValid: isValid, formElmObj: formElmObj, value: value });
              $timeout.cancel(_timer);
            }else {
              // Start validation only after the user has stopped typing in a field
              // everytime a new character is typed, it will cancel/restart the timer & we'll erase any error mmsg
              commonObj.updateErrorMsg('');
              $timeout.cancel(_timer);
              _timer = $timeout(function() {
                isValid = commonObj.validate(value, true);
                scope.$evalAsync(ctrl.$setValidity('validation', isValid ));
                deferred.resolve({ isFieldValid: isValid, formElmObj: formElmObj, value: value });
              }, waitingLimit);
            }
          }

          return deferred.promise;
        } // attemptToValidate()

        /** Attempt to validate an input value that was previously exploded from the input array
         * Each attempt will return a promise but only after reaching the last index, will we analyze the final validation.
         * @param string: input value
         * @param int: position index
         * @param int: size of original array
         */
        function attemptToValidateArrayInput(inputValue, index, arraySize) {
          var promise = attemptToValidate(inputValue, 0);
          if(!!promise && typeof promise.then === "function") {
            _promises.push(promise);

            // if we reached the last index
            // then loop through all promises to run validation on each array input values
            if(parseInt(index) === (arraySize - 1)) {
              _promises.forEach(function(promise) {
                promise.then(function(result) {
                  // user requires how many values of the array to make the form input to be valid?
                  // If require "one", as soon as an array value changes is valid, the complete input becomes valid
                  // If require "all", as soon as an array value changes is invalid, the complete input becomes invalid
                  switch(_validArrayRequireHowMany) {
                    case "all" :
                      if(result.isFieldValid === false) {
                        result.formElmObj.translatePromise.then(function(translation) {
                          // if user is requesting to see only the last error message, we will use '=' instead of usually concatenating with '+='
                          // then if validator rules has 'params' filled, then replace them inside the translation message (foo{0} {1}...), same syntax as String.format() in C#
                          if (_arrayErrorMessage.length > 0 && _globalOptions.displayOnlyLastErrorMsg) {
                            _arrayErrorMessage = '[' + result.value + '] :: ' + ((!!result.formElmObj.validator && !!result.formElmObj.validator.params) ? String.format(translation, result.formElmObj.validator.params) : translation);
                          } else {
                            _arrayErrorMessage += ' [' + result.value + '] :: ' + ((!!result.formElmObj.validator && !!result.formElmObj.validator.params) ? String.format(translation, result.formElmObj.validator.params) : translation);
                          }
                          commonObj.updateErrorMsg(_arrayErrorMessage, { isValid: false });
                          commonObj.addToValidationSummary(result.formElmObj, _arrayErrorMessage);
                        });
                      }
                      break;
                    case "one" :
                    default :
                      if(result.isFieldValid === true) {
                        ctrl.$setValidity('validation', true);
                        cancelValidation();
                      }
                  }
                });
              });
            }
          }
        }

        /** Definition of our blur event handler that will be used to attached on an element
         * @param object event
         */
        function blurHandler(event) {
          // get the form element custom object and use it after
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);
          var value = (typeof ctrl.$modelValue !== "undefined") ? ctrl.$modelValue : event.target.value;

          if (!!formElmObj && formElmObj.hasOwnProperty("isValidationCancelled")) {
            // attempt to validate & run validation callback if user requested it
            var validationPromise = attemptToValidate(value, 0);
            if(!!_validationCallback) {
              commonObj.runValidationCallbackOnPromise(validationPromise, _validationCallback);
            }
          }else {
            ctrl.$setValidity('validation', true);
          }
        }

        /** Explode the input array and attempt to validate every single input values that comes out of it.
         * Input array could be passed as 2 different types (array of string, array of objects)
         * If we are dealing with an array of strings, we will consider the strings being the input value to validate
         * But if instead it is an array of objects, we need to user to provide which object property name to use
         * ex. : array of objects, var arrObj = [{ id: 1, label: 'tag1' }, { id: 2, label: 'tag2' }]
         *       --> we want the user to tell the directive that the input values are in the property name 'label'
         * @param Array: input array
         * @param string: array type
         */
        function explodeArrayAndAttemptToValidate(inputArray, arrayType) {
          var arraySize = inputArray.length;

          // array of strings, 1 for loop to get all input values
          if(arrayType === "string") {
            for (var key in inputArray) {
              attemptToValidateArrayInput(inputArray[key], key, arraySize);
            }
          }
          // array of objects, 2 for loops to get all input values via an object property name defined by the user
          else if(arrayType === "object") {
            for (var key in inputArray) {
              if (inputArray.hasOwnProperty(key)) {
                var obj = inputArray[key];
                for (var prop in obj) {
                  // check if there's a property on the object, compare it to what the user defined as the object property label
                  // then attempt to validate the array input value
                  if(obj.hasOwnProperty(prop)) {
                    if(!!_validationArrayObjprop && prop !== _validationArrayObjprop) {
                      continue;
                    }
                    attemptToValidateArrayInput(obj[prop], key, arraySize);
                  }
                }
              }
            }
          }
        }

        /** Cancel the validation, unbind onBlur and remove from $validationSummary */
        function cancelAndUnbindValidation() {
          // unbind everything and cancel the validation
          cancelValidation();
          commonObj.removeFromValidationSummary(_elmName);

          // deregister the $watch from the _watchers array we kept it
          var foundWatcher = commonObj.arrayFindObject(_watchers, 'elmName', ctrl.$name);
          if(!!foundWatcher && typeof foundWatcher.watcherHandler === "function") {
            var deregister = foundWatcher.watcherHandler(); // deregister the watch by calling his handler
            _watchers.shift();
          }
        }

        /** Cancel current validation test and blank any leftover error message */
        function cancelValidation() {
          // get the form element custom object and use it after
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);
          if(!!formElmObj) {
            formElmObj.isValidationCancelled = true;
          }
          $timeout.cancel(_timer);
          commonObj.updateErrorMsg('');
          ctrl.$setValidity('validation', true);

          // unbind onBlur handler (if found) so that it does not fail on a non-required element that is now dirty & empty
          unbindBlurHandler();
        }

        /** watch the element for any value change, validate it once that happen
         * @return new watcher
         */
        function createWatch() {
          return scope.$watch(function() {
            var modelValue = ctrl.$modelValue;
            if(isKeyTypedBadInput()) {
              return { badInput: true };
            }
            else if(!!_validationArrayObjprop && Array.isArray(modelValue) && modelValue.length === 0 && Object.keys(modelValue).length > 0) {
              // when the modelValue is an Array but is length 0, this mean it's an Object disguise as an array
              // since an Array of length 0 won't trigger a watch change, we need to return it back to an object
              // for example Dropdown Multiselect when using selectionLimit of 1 will return [id: 1, label: 'John'], what we really want is the object { id: 1, label: 'John'}
              // convert the object array to a real object that will go inside an array
              var arr = [], obj = {};
              obj[_validationArrayObjprop] = modelValue[_validationArrayObjprop]; // convert [label: 'John'] to {label: 'John'}
              arr.push(obj); // push to array: [{label: 'John'}]
              return arr;
            }
            return modelValue;
          }, function(newValue, oldValue) {
            if(!!newValue && !!newValue.badInput) {
              unbindBlurHandler();
              return invalidateBadInputField();
            }
            // attempt to validate & run validation callback if user requested it
            var validationPromise = attemptToValidate(newValue);
            if(!!_validationCallback) {
              commonObj.runValidationCallbackOnPromise(validationPromise, _validationCallback);
            }
          }, true);
        }

        /** Invalidate the field that was tagged as bad input, cancel the timer validation,
         * display an invalid key error and add it as well to the validation summary.
         */
        function invalidateBadInputField() {
          $timeout.cancel(_timer);
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);
          commonObj.updateErrorMsg('INVALID_KEY_CHAR', { isValid: false, translate: true });
          commonObj.addToValidationSummary(formElmObj, 'INVALID_KEY_CHAR', true);
        }

        /** Was the characters typed by the user bad input or not?
         * @return bool
         */
        function isKeyTypedBadInput() {
          return (!!elm.prop('validity') && elm.prop('validity').badInput === true);
        }

        /** Re-evaluate the element and revalidate it, also re-attach the onBlur event on the element */
        function revalidateAndAttachOnBlur() {
          // Revalidate the input when enabled (without displaying the error)
          var value = ctrl.$modelValue !== null && typeof ctrl.$modelValue !== 'undefined'
                        ? ctrl.$modelValue
                        : '';
          if(!Array.isArray(value)) {
            ctrl.$setValidity('validation', commonObj.validate(value, false));
          }

          // get the form element custom object and use it after
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);
          if(!!formElmObj) {
            formElmObj.isValidationCancelled = false; // make sure validation re-enabled as well
          }

          // unbind previous handler (if any) not to have double handlers and then re-attach just 1 handler
          unbindBlurHandler();
          elm.bind('blur', blurHandler);
        }

        /** If found unbind the blur handler */
        function unbindBlurHandler() {
          if(typeof blurHandler === "function") {
            elm.unbind('blur', blurHandler);
          }
        }

      } // link()
    }; // return;
  }]); // directive
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
    validationCommon.prototype.arrayRemoveObject = arrayRemoveObject;                               // search an object inside an array of objects and remove it from array
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
          var ctrlForm = (!!_globalOptions.controllerAs && !!_globalOptions.controllerAs[formName])
			? _globalOptions.controllerAs[formName]
			: ((typeof self.elm.controller() !== "undefined") ? self.elm.controller()[formName] : null);

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
      var rules = self.validatorAttrs.rules || self.validatorAttrs.validation || '';

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
        self.ctrl.isErrorMessageVisible = true;
      } else {
        errorElm.html('');  // element is pristine or no validation applied, error message has to be blank
        self.ctrl.isErrorMessageVisible = undefined;
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

        // get the disabled & ngDisabled attributes if found
        var elmAttrDisabled = self.elm.prop("disabled");
        var elmAttrNgDisabled = (!!self.attrs) ? self.attrs.ngDisabled : self.validatorAttrs.ngDisabled;

        var isDisabled = (elmAttrDisabled === "")
            ? true
            : (typeof elmAttrDisabled === "boolean")
              ? elmAttrDisabled
              : (typeof elmAttrDisabled !== "undefined") ? self.scope.$eval(elmAttrDisabled) : false;

        var isNgDisabled = (elmAttrNgDisabled === "")
            ? true
            : (typeof elmAttrNgDisabled === "boolean")
              ? elmAttrNgDisabled
              : (typeof elmAttrNgDisabled !== "undefined") ? self.scope.$eval(elmAttrNgDisabled) : false;

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
        if ((!self.bFieldRequired && !strValue && !_validateOnEmpty) || (isDisabled || isNgDisabled)) {
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

    /** Quick function to remove an object inside an array by it's given field name and value, return and remove the object found or null
     * @param Array sourceArray
     * @param string searchId: search property id
     * @param string searchValue: value to search
     * @return object found from source array or null
     */
    function arrayRemoveObject(sourceArray, searchId, searchValue) {
      if (!!sourceArray) {
        for (var i = 0; i < sourceArray.length; i++) {
          if (sourceArray[i][searchId] === searchValue) {
            var itemToRemove = sourceArray[i];
	    sourceArray.splice(i,1);
	    return itemToRemove;
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
        var parentForm = (!!_globalOptions && !!_globalOptions.controllerAs && formName.indexOf('.') >= 0)
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

      isValid = ((!validator.pattern || validator.pattern.toString() === "/\\S+/" || (!!rules && validator.pattern === "required")) && strValue === null) 
        ? false
        : (testCondition(validator.condition, strValue, parentNgModelVal) && !!strValue);

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
        var isWatchValid = ((!validator.pattern || validator.pattern.toString() === "/\\S+/" || (!!rules && validator.pattern === "required")) && strValue === null) 
        ? false
        : (testCondition(validator.condition, strValue, parentNgModelVal) && !!strValue);

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
            if (!!previousPromise && typeof previousPromise.abort === "function") {
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
      var elmAttrDisabled = self.elm.prop("disabled");

      var isDisabled = (elmAttrDisabled === "")
            ? true
            : (typeof elmAttrDisabled === "boolean")
              ? elmAttrDisabled
              : (typeof elmAttrDisabled !== "undefined") ? self.scope.$eval(elmAttrDisabled) : false;

      var isNgDisabled = (elmAttrNgDisabled === "")
            ? true
            : (typeof elmAttrNgDisabled === "boolean")
              ? elmAttrNgDisabled
              : (typeof elmAttrNgDisabled !== "undefined") ? self.scope.$eval(elmAttrNgDisabled) : false;

      // a 'disabled' element should always be valid, there is no need to validate it
      if (isDisabled || isNgDisabled) {
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

/**
 * angular-validation-rules (ghiscoding)
 * https://github.com/ghiscoding/angular-validation
 *
 * @author: Ghislain B.
 * @desc: angular-validation rules definition
 * Each rule objects must have 3 properties {pattern, message, type}
 * and in some cases you could also define a 4th properties {params} to pass extras, for example: max_len will know his maximum length by this extra {params}
 * Rule.type can be {autoDetect, conditionalDate, conditionalNumber, matching, regex}
 *
 * WARNING: Rule patterns are defined as String type so don't forget to escape your characters: \\
 */
angular
	.module('ghiscoding.validation')
	.factory('ValidationRules', [function () {
		// return the service object
		var service = {
	    getElementValidators: getElementValidators
	  };
	  return service;

	  //----
		// Functions declaration
		//----------------------------------

		/** Get the element active validators and store it inside an array which will be returned
     * @param object args: all attributes
     */
    function getElementValidators(args) {
      // grab all passed attributes
      var alternateText = (typeof args.altText !== "undefined") ? args.altText.replace("alt=", "") : null;
      var customUserRegEx = (args.hasOwnProperty('customRegEx')) ? args.customRegEx : null;
      var rule = (args.hasOwnProperty('rule')) ? args.rule : null;
      var ruleParams = (args.hasOwnProperty('ruleParams')) ? args.ruleParams : null;

			// validators on the current DOM element, an element can have 1+ validators
			var validator = {};

      switch(rule) {
        case "accepted":
          validator = {
            pattern: /^(yes|on|1|true)$/i,
            message: "INVALID_ACCEPTED",
            type: "regex"
          };
          break;
        case "alpha" :
          validator = {
            pattern: /^([a-zа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ])+$/i,
            message: "INVALID_ALPHA",
            type: "regex"
          };
          break;
        case "alphaSpaces" :
        case "alpha_spaces" :
          validator = {
            pattern: /^([a-zа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ\s])+$/i,
            message: "INVALID_ALPHA_SPACE",
            type: "regex"
          };
          break;
        case "alphaNum" :
        case "alpha_num" :
          validator = {
            pattern: /^([a-zа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9])+$/i,
            message: "INVALID_ALPHA_NUM",
            type: "regex"
          };
          break;
        case "alphaNumSpaces" :
        case "alpha_num_spaces" :
          validator = {
            pattern: /^([a-zа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9\s])+$/i,
            message: "INVALID_ALPHA_NUM_SPACE",
            type: "regex"
          };
          break;
        case "alphaDash" :
        case "alpha_dash" :
          validator = {
            pattern: /^([a-zа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9_-])+$/i,
            message: "INVALID_ALPHA_DASH",
            type: "regex"
          };
          break;
        case "alphaDashSpaces" :
        case "alpha_dash_spaces" :
          validator = {
            pattern: /^([a-zа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9\s_-])+$/i,
            message: "INVALID_ALPHA_DASH_SPACE",
            type: "regex"
          };
          break;
        case "between" :
        case "range" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between:1,5";
          }
          validator = {
            patternLength: "^(.|[\\r\\n]){" + ranges[0] + "," + ranges[1] + "}$",
            messageLength: "INVALID_BETWEEN_CHAR",
            conditionNum: [">=","<="],
            messageNum: "INVALID_BETWEEN_NUM",
            params: [ranges[0], ranges[1]],
            type: "autoDetect"
          };
          break;
        case "betweenLen" :
        case "between_len" :
        case "stringLen" :
        case "string_len" :
        case "stringLength" :
        case "string_length" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_len:1,5";
          }
          validator = {
            pattern: "^(.|[\\r\\n]){" + ranges[0] + "," + ranges[1] + "}$",
            message: "INVALID_BETWEEN_CHAR",
            params: [ranges[0], ranges[1]],
            type: "regex"
          };
          break;
        case "betweenNum" :
        case "between_num" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_num:1,5";
          }
          validator = {
            condition: [">=","<="],
            message: "INVALID_BETWEEN_NUM",
            params: [ranges[0], ranges[1]],
            type: "conditionalNumber"
          };
          break;
        case "boolean":
          validator = {
            pattern: /^(true|false|0|1)$/i,
            message: "INVALID_BOOLEAN",
            type: "regex"
          };
          break;
        case "checked":
          validator = {
            pattern: /^true$/i,
            message: "INVALID_CHECKBOX_SELECTED",
            type: "regex"
          };
          break;
        case "creditCard" :
        case "credit_card" :
          validator = {
            pattern: /^3(?:[47]\d([ -]?)\d{4}(?:\1\d{4}){2}|0[0-5]\d{11}|[68]\d{12})$|^4(?:\d\d\d)?([ -]?)\d{4}(?:\2\d{4}){2}$|^6011([ -]?)\d{4}(?:\3\d{4}){2}$|^5[1-5]\d\d([ -]?)\d{4}(?:\4\d{4}){2}$|^2014\d{11}$|^2149\d{11}$|^2131\d{11}$|^1800\d{11}$|^3\d{15}$/,
            message: "INVALID_CREDIT_CARD",
            type: "regex"
          };
          break;
        case "custom" :
        case "javascript" :
          validator = {
            message: '', // there is no error message defined on this one since user will provide his own error message via remote response or `alt=`
            params: [ruleParams],
            type: "javascript"
          };
          break;
        case "dateEuro" :
        case "date_euro" :
          validator = {
            // accept long & short year (1996 or 96)
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_EURO",
            type: "regex"
          };
          break;
        case "dateEuroBetween" :
        case "date_euro_between" :
        case "betweenDateEuro" :
        case "between_date_euro" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_date_euro:01-01-1990,31-12-2015";
          }
          validator = {
            condition: [">=","<="],
            dateType: "EURO_LONG",
            params: [ranges[0], ranges[1]],
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_EURO_BETWEEN",
            type: "conditionalDate"
          };
          break;
        case "dateEuroMax" :
        case "date_euro_max" :
        case "maxDateEuro" :
        case "max_date_euro" :
          validator = {
            condition: "<=",
            dateType: "EURO_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_EURO_MAX",
            type: "conditionalDate"
          };
          break;
        case "dateEuroMin" :
        case "date_euro_min" :
        case "minDateEuro" :
        case "min_date_euro" :
          validator = {
            condition: ">=",
            dateType: "EURO_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_EURO_MIN",
            type: "conditionalDate"
          };
          break;
        case "dateEuroLong" :
        case "date_euro_long" :
          validator = {
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{4})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_EURO_LONG",
            type: "regex"
          };
          break;
        case "dateEuroLongBetween" :
        case "date_euro_long_between" :
        case "betweenDateEuroLong" :
        case "between_date_euro_long" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_date_euro_long:01-01-1990,31-12-2015";
          }
          validator = {
            condition: [">=","<="],
            dateType: "EURO_LONG",
            params: [ranges[0], ranges[1]],
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{4})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_EURO_LONG_BETWEEN",
            type: "conditionalDate"
          };
          break;
        case "dateEuroLongMax" :
        case "date_euro_long_max" :
        case "maxDateEuroLong" :
        case "max_date_euro_long" :
          validator = {
            condition: "<=",
            dateType: "EURO_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{4})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_EURO_LONG_MAX",
            type: "conditionalDate"
          };
          break;
        case "dateEuroLongMin" :
        case "date_euro_long_min" :
        case "minDateEuroLong" :
        case "min_date_euro_long" :
          validator = {
            condition: ">=",
            dateType: "EURO_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:31(\/|-|\.)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{4})$|^(?:29(\/|-|\.)02\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_EURO_LONG_MIN",
            type: "conditionalDate"
          };
          break;
        case "dateEuroShort" :
        case "date_euro_short" :
          validator = {
            pattern: /^(0[1-9]|[12][0-9]|3[01])[-\/\.](0[1-9]|1[012])[-\/\.]\d\d$/,
            message: "INVALID_DATE_EURO_SHORT",
            type: "regex"
          };
          break;
        case "dateEuroShortBetween" :
        case "date_euro_short_between" :
        case "betweenDateEuroShort" :
        case "between_date_euro_short" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_date_euro_short:01-01-90,31-12-15";
          }
          validator = {
            condition: [">=","<="],
            dateType: "EURO_SHORT",
            params: [ranges[0], ranges[1]],
            pattern: /^(0[1-9]|[12][0-9]|3[01])[-\/\.](0[1-9]|1[012])[-\/\.]\d\d$/,
            message: "INVALID_DATE_EURO_SHORT_BETWEEN",
            type: "conditionalDate"
          };
          break;
        case "dateEuroShortMax" :
        case "date_euro_short_max" :
        case "maxDateEuroShort" :
        case "max_date_euro_short" :
          validator = {
            condition: "<=",
            dateType: "EURO_SHORT",
            params: [ruleParams],
            pattern: /^(0[1-9]|[12][0-9]|3[01])[-\/\.](0[1-9]|1[012])[-\/\.]\d\d$/,
            message: "INVALID_DATE_EURO_SHORT_MAX",
            type: "conditionalDate"
          };
          break;
        case "dateEuroShortMin" :
        case "date_euro_short_min" :
        case "minDateEuroShort" :
        case "min_date_euro_short" :
          validator = {
            condition: ">=",
            dateType: "EURO_SHORT",
            params: [ruleParams],
            pattern: /^(0[1-9]|[12][0-9]|3[01])[-\/\.](0[1-9]|1[012])[-\/\.]\d\d$/,
            message: "INVALID_DATE_EURO_SHORT_MIN",
            type: "conditionalDate"
          };
          break;
        case "dateIso" :
        case "date_iso" :
          validator = {
            pattern: /^(?=\d)(?:(?!(?:1582(?:\-)10(?:\-)(?:0?[5-9]|1[0-4]))|(?:1752(?:\-)0?9(?:\-)(?:0?[3-9]|1[0-3])))(?=(?:(?!000[04]|(?:(?:1[^0-6]|[2468][^048]|[3579][^26])00))(?:(?:\d\d)(?:[02468][048]|[13579][26]))\D0?2\D29)|(?:\d{4}\D(?!(?:0?[2469]|11)\D31)(?!0?2(?:\-)(?:29|30))))(\d{4})(\-)(0{1}\d|1[012])\2((?!00)[012]{1}\d|3[01])(?:$|(?=\d)))?((?:(?:0?[1-9]|1[012])(?::[0-5]\d){0,2})|(?:[01]\d|2[0-3])(?::[0-5]\d){2})?$/,
            message: "INVALID_DATE_ISO",
            type: "regex"
          };
          break;
        case "dateIsoBetween" :
        case "date_iso_between" :
        case "betweenDateIso" :
        case "between_date_iso" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_date_iso:1990-01-01,2000-12-31";
          }
          validator = {
            condition: [">=","<="],
            dateType: "ISO",
            params: [ranges[0], ranges[1]],
            pattern: /^(?=\d)(?:(?!(?:1582(?:\-)10(?:\-)(?:0?[5-9]|1[0-4]))|(?:1752(?:\-)0?9(?:\-)(?:0?[3-9]|1[0-3])))(?=(?:(?!000[04]|(?:(?:1[^0-6]|[2468][^048]|[3579][^26])00))(?:(?:\d\d)(?:[02468][048]|[13579][26]))\D0?2\D29)|(?:\d{4}\D(?!(?:0?[2469]|11)\D31)(?!0?2(?:\-)(?:29|30))))(\d{4})(\-)(0{1}\d|1[012])\2((?!00)[012]{1}\d|3[01])(?:$|(?=\d)))?((?:(?:0?[1-9]|1[012])(?::[0-5]\d){0,2})|(?:[01]\d|2[0-3])(?::[0-5]\d){2})?$/,
            message: "INVALID_DATE_ISO_BETWEEN",
            type: "conditionalDate"
          };
          break;
        case "dateIsoMax" :
        case "date_iso_max" :
        case "maxDateIso" :
        case "max_date_iso" :
          validator = {
            condition: "<=",
            dateType: "ISO",
            params: [ruleParams],
            pattern: /^(?=\d)(?:(?!(?:1582(?:\-)10(?:\-)(?:0?[5-9]|1[0-4]))|(?:1752(?:\-)0?9(?:\-)(?:0?[3-9]|1[0-3])))(?=(?:(?!000[04]|(?:(?:1[^0-6]|[2468][^048]|[3579][^26])00))(?:(?:\d\d)(?:[02468][048]|[13579][26]))\D0?2\D29)|(?:\d{4}\D(?!(?:0?[2469]|11)\D31)(?!0?2(?:\-)(?:29|30))))(\d{4})(\-)(0{1}\d|1[012])\2((?!00)[012]{1}\d|3[01])(?:$|(?=\d)))?((?:(?:0?[1-9]|1[012])(?::[0-5]\d){0,2})|(?:[01]\d|2[0-3])(?::[0-5]\d){2})?$/,
            message: "INVALID_DATE_ISO_MAX",
            type: "conditionalDate"
          };
          break;
        case "dateIsoMin" :
        case "date_iso_min" :
        case "minDateIso" :
        case "min_date_iso" :
          validator = {
            condition: ">=",
            dateType: "ISO",
            params: [ruleParams],
            pattern: /^(?=\d)(?:(?!(?:1582(?:\-)10(?:\-)(?:0?[5-9]|1[0-4]))|(?:1752(?:\-)0?9(?:\-)(?:0?[3-9]|1[0-3])))(?=(?:(?!000[04]|(?:(?:1[^0-6]|[2468][^048]|[3579][^26])00))(?:(?:\d\d)(?:[02468][048]|[13579][26]))\D0?2\D29)|(?:\d{4}\D(?!(?:0?[2469]|11)\D31)(?!0?2(?:\-)(?:29|30))))(\d{4})(\-)(0{1}\d|1[012])\2((?!00)[012]{1}\d|3[01])(?:$|(?=\d)))?((?:(?:0?[1-9]|1[012])(?::[0-5]\d){0,2})|(?:[01]\d|2[0-3])(?::[0-5]\d){2})?$/,
            message: "INVALID_DATE_ISO_MIN",
            type: "conditionalDate"
          };
          break;
        case "dateUs" :
        case "date_us" :
          validator = {
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_US",
            type: "regex"
          };
          break;
        case "dateUsBetween" :
        case "date_us_between" :
        case "betweenDateUs" :
        case "between_date_us" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_date_us:01/01/1990,12/31/2015";
          }
          validator = {
            condition: [">=","<="],
            dateType: "US_LONG",
            params: [ranges[0], ranges[1]],
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_US_BETWEEN",
            type: "conditionalDate"
          };
          break;
        case "dateUsMax" :
        case "date_us_max" :
        case "maxDateUs" :
        case "max_date_us" :
          validator = {
            condition: "<=",
            dateType: "US_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_US_MAX",
            type: "conditionalDate"
          };
          break;
        case "dateUsMin" :
        case "date_us_min" :
        case "minDateUs" :
        case "min_date_us" :
          validator = {
            condition: ">=",
            dateType: "US_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])?00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
            message: "INVALID_DATE_US_MIN",
            type: "conditionalDate"
          };
          break;
        case "dateUsLong" :
        case "date_us_long" :
          validator = {
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_US_LONG",
            type: "regex"
          };
          break;
        case "dateUsLongBetween" :
        case "date_us_long_between" :
        case "betweenDateUsLong" :
        case "between_date_us_long" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_date_us_long:01/01/1990,12/31/2015";
          }
          validator = {
            condition: [">=","<="],
            dateType: "US_LONG",
            params: [ranges[0], ranges[1]],
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_US_LONG_BETWEEN",
            type: "conditionalDate"
          };
          break;
        case "dateUsLongMax" :
        case "date_us_long_max" :
        case "maxDateUsLong" :
        case "max_date_us_long" :
          validator = {
            condition: "<=",
            dateType: "US_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_US_LONG_MAX",
            type: "conditionalDate"
          };
          break;
        case "dateUsLongMin" :
        case "date_us_long_min" :
        case "minDateUsLong" :
        case "min_date_us_long" :
          validator = {
            condition: ">=",
            dateType: "US_LONG",
            params: [ruleParams],
            pattern: /^(?:(?:(?:0[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:02(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0[1-9])|(?:1[0-2]))(\/|-|\.)(?:0[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
            message: "INVALID_DATE_US_LONG_MIN",
            type: "conditionalDate"
          };
          break;
        case "dateUsShort" :
        case "date_us_short" :
          validator = {
            pattern: /^(0[1-9]|1[012])[-\/\.](0[1-9]|[12][0-9]|3[01])[-\/\.]\d\d$/,
            message: "INVALID_DATE_US_SHORT",
            type: "regex"
          };
          break;
        case "dateUsShortBetween" :
        case "date_us_short_between" :
        case "betweenDateUsShort" :
        case "between_date_us_short" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_date_us_short:01/01/90,12/31/15";
          }
          validator = {
            condition: [">=","<="],
            dateType: "US_SHORT",
            params: [ranges[0], ranges[1]],
            pattern: /^(0[1-9]|1[012])[-\/\.](0[1-9]|[12][0-9]|3[01])[-\/\.]\d\d$/,
            message: "INVALID_DATE_US_SHORT_BETWEEN",
            type: "conditionalDate"
          };
          break;
        case "dateUsShortMax" :
        case "date_us_short_max" :
        case "maxDateUsShort" :
        case "max_date_us_short" :
          validator = {
            condition: "<=",
            dateType: "US_SHORT",
            params: [ruleParams],
            pattern: /^(0[1-9]|1[012])[-\/\.](0[1-9]|[12][0-9]|3[01])[-\/\.]\d\d$/,
            message: "INVALID_DATE_US_SHORT_MAX",
            type: "conditionalDate"
          };
          break;
        case "dateUsShortMin" :
        case "date_us_short_min" :
        case "minDateUsShort" :
        case "min_date_us_short" :
          validator = {
            condition: ">=",
            dateType: "US_SHORT",
            params: [ruleParams],
            pattern: /^(0[1-9]|1[012])[-\/\.](0[1-9]|[12][0-9]|3[01])[-\/\.]\d\d$/,
            message: "INVALID_DATE_US_SHORT_MIN",
            type: "conditionalDate"
          };
          break;
        case "different" :
        case "differentInput" :
        case "different_input" :
          var args = ruleParams.split(',');
          validator = {
            condition: "!=",
            message: "INVALID_INPUT_DIFFERENT",
            params: args,
            type: "matching"
          };
          break;
        case "digits" :
          validator = {
            pattern: "^\\d{" + ruleParams + "}$",
            message: "INVALID_DIGITS",
            params: [ruleParams],
            type: "regex"
          };
          break;
        case "digitsBetween" :
        case "digits_between" :
          var ranges = ruleParams.split(',');
          if (ranges.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: digits_between:1,5";
          }
          validator = {
            pattern: "^\\d{" + ranges[0] + "," + ranges[1] + "}$",
            message: "INVALID_DIGITS_BETWEEN",
            params: [ranges[0], ranges[1]],
            type: "regex"
          };
          break;
        case "email" :
        case "emailAddress" :
        case "email_address" :
          validator = {
            // Email RFC 5322, pattern pulled from  http://www.regular-expressions.info/email.html
            // but removed necessity of a TLD (Top Level Domain) which makes this email valid: admin@mailserver1
            pattern: /^[-\wа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9#~!$%^&*_=+\/`\|}{\'?]+(\.[-\wа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9#~!$%^&*_=+\/`\|}{\'?]+)*@([\wа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9_][-\wа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9_]*(\.[-\wа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ0-9_]+)*([\wа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ]+)|(\.[\wа-яàáâãäåąæçćèéêëęœìíïîłńðòóôõöøśùúûñüýÿżźßÞďđ]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,
            message: "INVALID_EMAIL",
            type: "regex"
          };
          break;
        case "exactLen" :
        case "exact_len" :
          validator = {
            pattern: "^(.|[\\r\\n]){" + ruleParams + "}$",
            message: "INVALID_EXACT_LEN",
            params: [ruleParams],
            type: "regex"
          };
          break;
        case "float" :
          validator = {
            pattern: /^\d*\.{1}\d+$/,
            message: "INVALID_FLOAT",
            type: "regex"
          };
          break;
        case "floatSigned" :
        case "float_signed" :
          validator = {
            pattern: /^[-+]?\d*\.{1}\d+$/,
            message: "INVALID_FLOAT_SIGNED",
            type: "regex"
          };
          break;
        case "iban" :
          validator = {
            pattern: /^[a-zA-Z]{2}\d{2}\s?([0-9a-zA-Z]{4}\s?){4}[0-9a-zA-Z]{2}$/i,
            message: "INVALID_IBAN",
            type: "regex"
          };
          break;
        case "enum" :
        case "in" :
        case "inList" :
        case "in_list" :
          var list = RegExp().escape(ruleParams).replace(/,/g, '|'); // escape string & replace comma (,) by pipe (|)
          validator = {
            pattern: "^(" + list + ")$",
            patternFlag: 'i',
            message: "INVALID_IN_LIST",
            params: [ruleParams],
            type: "regex"
          };
          break;
        case "int" :
        case "integer" :
          validator = {
            pattern: /^\d+$/,
            message: "INVALID_INTEGER",
            type: "regex"
          };
          break;
        case "intSigned" :
        case "integerSigned" :
        case "int_signed" :
        case "integer_signed" :
          validator = {
            pattern: /^[+-]?\d+$/,
            message: "INVALID_INTEGER_SIGNED",
            type: "regex"
          };
          break;
        case "ip" :
        case "ipv4" :
          validator = {
            pattern: /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}$/,
            message: "INVALID_IPV4",
            type: "regex"
          };
          break;
        case "ipv6" :
          validator = {
            pattern: /^(::|(([a-fA-F0-9]{1,4}):){7}(([a-fA-F0-9]{1,4}))|(:(:([a-fA-F0-9]{1,4})){1,6})|((([a-fA-F0-9]{1,4}):){1,6}:)|((([a-fA-F0-9]{1,4}):)(:([a-fA-F0-9]{1,4})){1,6})|((([a-fA-F0-9]{1,4}):){2}(:([a-fA-F0-9]{1,4})){1,5})|((([a-fA-F0-9]{1,4}):){3}(:([a-fA-F0-9]{1,4})){1,4})|((([a-fA-F0-9]{1,4}):){4}(:([a-fA-F0-9]{1,4})){1,3})|((([a-fA-F0-9]{1,4}):){5}(:([a-fA-F0-9]{1,4})){1,2}))$/i,
            message: "INVALID_IPV6",
            type: "regex"
          };
          break;
        case "compare" :
        case "match" :
        case "matchInput" :
        case "match_input" :
        case "same" :
          var args = ruleParams.split(',');
          validator = {
            condition: "===",
            message: "INVALID_INPUT_MATCH",
            params: args,
            type: "matching"
          };
          break;
        case "max" :
          validator = {
            patternLength: "^(.|[\\r\\n]){0," + ruleParams + "}$",
            messageLength: "INVALID_MAX_CHAR",
            conditionNum: "<=",
            messageNum: "INVALID_MAX_NUM",
            params: [ruleParams],
            type: "autoDetect"
          };
          break;
        case "maxLen" :
        case "max_len" :
        case "maxLength" :
        case "max_length" :
          validator = {
            pattern: "^(.|[\\r\\n]){0," + ruleParams + "}$",
            message: "INVALID_MAX_CHAR",
            params: [ruleParams],
            type: "regex"
          };
          break;
        case "maxNum" :
        case "max_num" :
          validator = {
            condition: "<=",
            message: "INVALID_MAX_NUM",
            params: [ruleParams],
            type: "conditionalNumber"
          };
          break;
        case "min" :
          validator = {
            patternLength: "^(.|[\\r\\n]){" + ruleParams + ",}$",
            messageLength: "INVALID_MIN_CHAR",
            conditionNum: ">=",
            messageNum: "INVALID_MIN_NUM",
            params: [ruleParams],
            type: "autoDetect"
          };
          break;
        case "minLen" :
        case "min_len" :
        case "minLength" :
        case "min_length" :
          validator = {
            pattern: "^(.|[\\r\\n]){" + ruleParams + ",}$",
            message: "INVALID_MIN_CHAR",
            params: [ruleParams],
            type: "regex"
          };
          break;
        case "minNum" :
        case "min_num" :
          validator = {
            condition: ">=",
            message: "INVALID_MIN_NUM",
            params: [ruleParams],
            type: "conditionalNumber"
          };
          break;
        case "notIn" :
        case "not_in" :
        case "notInList" :
        case "not_in_list" :
          var list = RegExp().escape(ruleParams).replace(/,/g, '|'); // escape string & replace comma (,) by pipe (|)
          validator = {
            pattern: "^((?!(" + list + ")).)+$",
            patternFlag: 'i',
            message: "INVALID_NOT_IN_LIST",
            params: [ruleParams],
            type: "regex"
          };
          break;
        case "numeric" :
          validator = {
            pattern: /^\d*\.?\d+$/,
            message: "INVALID_NUMERIC",
            type: "regex"
          };
          break;
        case "numericSigned" :
        case "numeric_signed" :
          validator = {
            pattern: /^[-+]?\d*\.?\d+$/,
            message: "INVALID_NUMERIC_SIGNED",
            type: "regex"
          };
          break;
        case "phone" :
          validator = {
            pattern: /^([0-9]( |[-.])?)?((\(\d{3}\) ?)|(\d{3}[-.]))?\d{3}[-.]\d{4}$/,
            message: "INVALID_PHONE_US",
            type: "regex"
          };
          break;
        case "phoneInternational" :
        case "phone_international" :
          validator = {
            pattern: /^\+(?:[0-9]\x20?){6,14}[0-9]$/,
            message: "INVALID_PHONE_INTERNATIONAL",
            type: "regex"
          };
          break;
        case "pattern" :
        case "regex" :
          // Custom User Regex is a special case, the properties (message, pattern) were created and dealt separately prior to the for loop
          validator = {
            pattern: customUserRegEx.pattern,
            message: "INVALID_PATTERN",
            params: [customUserRegEx.message],
            type: "regex"
          };
          break;
        case "remote" :
          validator = {
            message: '', // there is no error message defined on this one since user will provide his own error message via remote response or `alt=`
            params: [ruleParams],
            type: "remote"
          };
          break;
        case "required" :
          validator = {
            pattern: /\S+/,
            message: "INVALID_REQUIRED",
            type: "regex"
          };
          break;
        case "size" :
          validator = {
            patternLength: "^(.|[\\r\\n]){" + ruleParams + "}$",
            messageLength: "INVALID_EXACT_LEN",
            conditionNum: "==",
            messageNum: "INVALID_EXACT_NUM",
            params: [ruleParams],
            type: "autoDetect"
          };
          break;
        case "url" :
          validator = {
            pattern: /^(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:\/~\+#]*[\w\-\@?^=%&amp;\/~\+#])?/i,
            message: "INVALID_URL",
            type: "regex"
          };
          break;
        case "time" :
          validator = {
            pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
            message: "INVALID_TIME",
            type: "regex"
          };
          break;
      } // switch()

      // add the possible alternate text user might have provided
      validator.altText = alternateText;

	    return validator;
		} // getElementValidators()
}]);

/** extend RegExp object to have an escape function
 * @param string text
 * @return escaped string
 */
RegExp.prototype.escape = function(text) {
  if (!arguments.callee.sRE) {
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];
    arguments.callee.sRE = new RegExp(
      '(\\' + specials.join('|\\') + ')', 'g'
    );
  }
  return text.replace(arguments.callee.sRE, '\\$1');
}
/**
 * Angular-Validation Service (ghiscoding)
 * https://github.com/ghiscoding/angular-validation
 *
 * @author: Ghislain B.
 * @desc: angular-validation service definition
 * Provide a way to programmatically create validators and validate a form directly from within the controller.
 * This Service is totally independant from the Directive, it could be used separately but the minimum it needs is the `validation-rules.js` file.
 */
angular
	.module('ghiscoding.validation')
	.service('ValidationService', ['$interpolate', '$q', '$timeout', 'ValidationCommon', function ($interpolate, $q, $timeout, ValidationCommon) {
    // global variables of our object (start with _var)
	  var _blurHandler;
    var _watchers = [];
    var _validateOnEmpty;
    var _validationCallback;
    var _globalOptions;

    // service constructor
    var ValidationService = function (globalOptions) {
      this.isValidationCancelled = false;       // is the validation cancelled?
      this.timer = null;                        // timer of user inactivity time
      this.validationAttrs = {};                // Current Validator attributes
      this.commonObj = new ValidationCommon();  // Object of validationCommon service

      // if global options were passed to the constructor
      if (!!globalOptions) {
        this.setGlobalOptions(globalOptions);
      }

      _globalOptions = this.commonObj.getGlobalOptions();
    }

    // list of available published public functions of this object
    ValidationService.prototype.addValidator = addValidator;                                          // add a Validator to current element
    ValidationService.prototype.checkFormValidity = checkFormValidity;                                // check the form validity (can be called by an empty ValidationService and used by both Directive/Service)
    ValidationService.prototype.removeValidator = removeValidator;                                    // remove a Validator from an element
    ValidationService.prototype.resetForm = resetForm;                                                // reset the form (reset it to Pristine and Untouched)
    ValidationService.prototype.setDisplayOnlyLastErrorMsg = setDisplayOnlyLastErrorMsg;              // setter on the behaviour of displaying only the last error message
    ValidationService.prototype.setGlobalOptions = setGlobalOptions;                                  // set and initialize global options used by all validators
    ValidationService.prototype.clearInvalidValidatorsInSummary = clearInvalidValidatorsInSummary;    // clear clearInvalidValidatorsInSummary

    return ValidationService;

	  //----
		// Public Functions declaration
		//----------------------------------

		/** Add a validator on a form element, the argument could be passed as 1 single object (having all properties) or 2 to 3 string arguments
     * @param mixed var1: could be a string (element name) or an object representing the validator
     * @param string var2: [optional] validator rules
     * @param string var3: [optional] friendly name
		 */
		function addValidator(var1, var2, var3) {
      var self = this;
      var attrs = {};

      // find if user provided 2 string arguments else it will be a single object with all properties
      if(typeof var1 === "string" && typeof var2 === "string") {
        attrs.elmName = var1;
        attrs.rules = var2;
        attrs.friendlyName = (typeof var3 === "string") ? var3 : '';
      }else {
        attrs = var1;
      }

      // Make sure that we have all required attributes to work properly
      if(typeof attrs !== "object" || !attrs.hasOwnProperty('elmName') || !attrs.hasOwnProperty('rules') || (!attrs.hasOwnProperty('scope') && typeof self.validationAttrs.scope === "undefined") ) {
        throw 'Angular-Validation-Service requires at least the following 3 attributes: {elmName, rules, scope}';
      }

      // get the scope from the validator or from the global options (validationAttrs)
      var scope = (!!attrs.scope) ? attrs.scope : self.validationAttrs.scope;

      // find the DOM element & make sure it's a filled object before going further
      // we will exclude disabled/ng-disabled element from being validated
      attrs.elm = angular.element(document.querySelector('[name="'+attrs.elmName+'"]'));
      if(typeof attrs.elm !== "object" || attrs.elm.length === 0) {
        return self;
      }

      // copy the element attributes name to use throughout validationCommon
      // when using dynamic elements, we might have encounter unparsed or uncompiled data, we need to get Angular result with $interpolate
      if(new RegExp("{{(.*?)}}").test(attrs.elmName)) {
        attrs.elmName = $interpolate(attrs.elmName)(scope);
      }
      attrs.name = attrs.elmName;

      // user could pass his own scope, useful in a case of an isolate scope
      if (!!self.validationAttrs.isolatedScope || attrs.isolatedScope) {
        var tempValidationOptions = scope.$validationOptions || null;           // keep global validationOptions
        scope = self.validationAttrs.isolatedScope || attrs.isolatedScope;  // rewrite original scope
        if(!!tempValidationOptions) {
          scope.$validationOptions = tempValidationOptions;                     // reuse the validationOption from original scope
        }
      }

      // onBlur make validation without waiting
      attrs.elm.bind('blur', _blurHandler = function(event) {
        // get the form element custom object and use it after
        var formElmObj = self.commonObj.getFormElementByName(attrs.elmName);

        if (!!formElmObj && !formElmObj.isValidationCancelled) {
          // re-initialize to use current element & validate without delay
          self.commonObj.initialize(scope, attrs.elm, attrs, attrs.ctrl);

          // attempt to validate & run validation callback if user requested it
	        var validationPromise = attemptToValidate(self, (attrs.ctrl.$modelValue == undefined ? '' : attrs.ctrl.$modelValue), 0);
          if(!!_validationCallback) {
            self.commonObj.runValidationCallbackOnPromise(validationPromise, _validationCallback);
          }
        }
      });

      // merge both attributes but 2nd object (attrs) as higher priority, so that for example debounce property inside `attrs` as higher priority over `validatorAttrs`
      // so the position inside the mergeObject call is very important
      attrs = self.commonObj.mergeObjects(self.validationAttrs, attrs);

      // Possible element attributes
      _validationCallback = (attrs.hasOwnProperty('validationCallback')) ? attrs.validationCallback : null;
      _validateOnEmpty = (attrs.hasOwnProperty('validateOnEmpty')) ? self.commonObj.parseBool(attrs.validateOnEmpty) : !!_globalOptions.validateOnEmpty;

      // watch the `disabled` attribute for changes
      // if it become disabled then skip validation else it becomes enable then we need to revalidate it
      watchNgDisabled(self, scope, attrs);

      // if DOM element gets destroyed, we need to cancel validation, unbind onBlur & remove it from $validationSummary
      attrs.elm.on('$destroy', function() {
        // get the form element custom object and use it after
        var formElmObj = self.commonObj.getFormElementByName(self.commonObj.ctrl.$name);

        // unbind everything and cancel the validation
        if(!!formElmObj) {
          cancelValidation(self, formElmObj);
          self.commonObj.removeFromValidationSummary(attrs.name);
        }
      });

      // save the watcher inside an array in case we want to deregister it when removing a validator
      _watchers.push({ elmName: attrs.elmName, watcherHandler: createWatch(scope, attrs, self) });

      return self;
		} // addValidator()

    /** Check the form validity (can be called by an empty ValidationService and used by both Directive/Service)
     * Loop through Validation Summary and if any errors found then display them and return false on current function
     * @param object Angular Form or Scope Object
     * @param bool silently, do a form validation silently
     * @return bool isFormValid
     */
    function checkFormValidity(obj, silently) {
      var self = this;
      var ctrl, elm, elmName = '', isValid = true;
      if(typeof obj === "undefined" || typeof obj.$validationSummary === "undefined") {
        throw 'checkFormValidity() requires a valid Angular Form or $scope/vm object passed as argument to work properly, for example:: fn($scope) OR fn($scope.form1) OR fn(vm) OR fn(vm.form1)';
      }

      // loop through $validationSummary and display errors when found on each field
      for(var i = 0, ln = obj.$validationSummary.length; i < ln; i++) {
        isValid = false;
        elmName = obj.$validationSummary[i].field;

        if(!!elmName) {
          // get the form element custom object and use it after
          var formElmObj = self.commonObj.getFormElementByName(elmName);

          if(!!formElmObj && !!formElmObj.elm && formElmObj.elm.length > 0) {
            // make the element as it was touched for CSS, only works in AngularJS 1.3+
            if (typeof formElmObj.ctrl.$setTouched === "function" && !silently) {
              formElmObj.ctrl.$setTouched();
            }
            self.commonObj.updateErrorMsg(obj.$validationSummary[i].message, { isSubmitted: (!!silently ? false : true), isValid: formElmObj.isValid, obj: formElmObj });
          }
        }
      }
      return isValid;
    }

    /** Remove all objects in validationsummary and matching objects in FormElementList.
     * This is for use in a wizard type setting, where you 'move back' to a previous page in wizard.
     * In this case you need to remove invalid validators that will exist in 'the future'.
     * @param object Angular Form or Scope Object
     */
    function clearInvalidValidatorsInSummary(obj) {
      var self = this;
      if (typeof obj === "undefined" || typeof obj.$validationSummary === "undefined") {
        throw 'clearInvalidValidatorsInSummary() requires a valid Angular Form or $scope/vm object passed as argument to work properly, for example:: fn($scope) OR fn($scope.form1) OR fn(vm) OR fn(vm.form1)';
      }
      // Get list of names to remove
      var elmName = [];
      for (var i = 0, ln = obj.$validationSummary.length; i < ln; i++) {
        elmName.push(obj.$validationSummary[i].field);
      }
      // Loop on list of names. Cannot loop on obj.$validationSummary as you are removing objects from it in the loop.
      for (i = 0, ln = elmName.length; i < ln; i++) {
        if (!!elmName[i]) {
          self.commonObj.removeFromFormElementObjectList(elmName[i]);
          self.commonObj.removeFromValidationSummary(elmName[i], obj.$validationSummary);
        }
      }
    }

    /** Remove a validator and also any withstanding error message from that element
     * @param object Angular Form or Scope Object
     * @param object arguments that could be passed to the function
     * @return object self
     */
    function removeValidator(obj, args) {
      var self = this;
      var formElmObj;

      if(typeof obj === "undefined" || typeof obj.$validationSummary === "undefined") {
        throw 'removeValidator() only works with Validation that were defined by the Service (not by the Directive) and requires a valid Angular Form or $scope/vm object passed as argument to work properly, for example:: fn($scope) OR fn($scope.form1) OR fn(vm) OR fn(vm.form1)';
      }

      // Note: removeAttr() will remove validation attribute from the DOM (if defined by Directive), but as no effect when defined by the Service
      // removeValidator() 2nd argument could be passed an Array or a string of element name(s)
      //   if it's an Array we will loop through all elements to be removed
      //   else just remove the 1 element defined as a string
      if (args instanceof Array) {
        for (var i = 0, ln = args.length; i < ln; i++) {
          formElmObj = self.commonObj.getFormElementByName(args[i]);
          formElmObj.elm.removeAttr('validation');
          removeWatcherAndErrorMessage(self, formElmObj, obj.$validationSummary);
        }
      }
      else if(args instanceof Object && !!args.formElmObj) {
        formElmObj = args.formElmObj;
        formElmObj.elm.removeAttr('validation');
        removeWatcherAndErrorMessage(args.self, formElmObj, obj.$validationSummary);
      }
      else {
        formElmObj = self.commonObj.getFormElementByName(args);
        formElmObj.elm.removeAttr('validation');
        removeWatcherAndErrorMessage(self, formElmObj, obj.$validationSummary);
      }

      return self;
    }

    /** Reset a Form, reset all input element to Pristine, Untouched & remove error dislayed (if any)
     * @param object Angular Form or Scope Object
     * @param object arguments that could be passed to the function
     */
    function resetForm(obj, args) {
      var self = this;
      var formElmObj;
      var args = args || {};
      var shouldRemoveValidator = (typeof args.removeAllValidators !== "undefined") ? args.removeAllValidators : false;
      var shouldEmptyValues = (typeof args.emptyAllInputValues !== "undefined") ? args.emptyAllInputValues : false;

      if(typeof obj === "undefined" || typeof obj.$name === "undefined") {
        throw 'resetForm() requires a valid Angular Form object passed as argument to work properly (ex.: $scope.form1).';
      }

      // get all Form input elements and loop through all of them to set them Pristine, Untouched and also remove errors displayed
      var formElements = self.commonObj.getFormElements(obj.$name);
      if(formElements instanceof Array) {
        for (var i = 0, ln = formElements.length; i < ln; i++) {
          formElmObj = formElements[i];

          // should we empty input elment values as well?
          if(!!shouldEmptyValues) {
            formElmObj.elm.val(null);
          }

          // should we remove all validators?
          // if yes, then run removeValidator() and since that already removes message & make input valid, no need to run the $setUntouched() and $setPristine()
          // else make the field $setUntouched() and $setPristine()
          if(!!shouldRemoveValidator) {
            removeValidator(obj, { self: self, formElmObj: formElmObj});
          }else {
            // make the element as it was touched for CSS, only works in AngularJS 1.3+
            if (typeof formElmObj.ctrl.$setUntouched === "function") {
              formElmObj.ctrl.$setUntouched();
            }
            formElmObj.ctrl.$setPristine();
            self.commonObj.updateErrorMsg('', { isValid: false, obj: formElmObj });
          }
        }
      }
    }

	  /** Setter on the behaviour of displaying only the last error message of each element.
     * By default this is false, so the behavior is to display all error messages of each element.
     * @param boolean value
     */
    function setDisplayOnlyLastErrorMsg(boolValue) {
      var self = this;
      var isDisplaying = (typeof boolValue === "boolean") ? boolValue : true;
      self.commonObj.setDisplayOnlyLastErrorMsg(isDisplaying);
    }

    /** Set and initialize global options used by all validators
     * @param object: global options
     * @return object self
     */
    function setGlobalOptions(options) {
      var self = this;
      self.validationAttrs = options; // save in global
      self.commonObj.setGlobalOptions(options);

      return self;
    }

    //----
    // Private functions declaration
    //----------------------------------

    /** Validator function to attach to the element, this will get call whenever the input field is updated
     *  and is also customizable through the (typing-limit) for which inactivity this.timer will trigger validation.
     * @param object self
     * @param string value: value of the input field
     * @param int typingLimit: when user stop typing, in how much time it will start validating
     * @return object validation promise
     */
    function attemptToValidate(self, value, typingLimit) {
      var deferred = $q.defer();
      var isValid = false;

      // get the waiting delay time if passed as argument or get it from common Object
      var waitingLimit = (typeof typingLimit !== "undefined") ? typingLimit : self.commonObj.typingLimit;

      // get the form element custom object and use it after
      var formElmObj = self.commonObj.getFormElementByName(self.commonObj.ctrl.$name);

      // if a field holds invalid characters which are not numbers inside an `input type="number"`, then it's automatically invalid
      // we will still call the `.validate()` function so that it shows also the possible other error messages
      if(!!value && !!value.badInput) {
        return invalidateBadInputField(self, attrs.name);
      }

      // pre-validate without any events just to pre-fill our validationSummary with all field errors
      // passing false as 2nd argument for not showing any errors on screen
      self.commonObj.validate(value, false);
	    
      // check field level setting for validateOnEmpty 
      var isFieldValidateOnEmpty = (self.commonObj.validatorAttrs && self.commonObj.validatorAttrs.validateOnEmpty);
	    
      // if field is not required and his value is empty, cancel validation and exit out
      if(!self.commonObj.isFieldRequired() && !(_validateOnEmpty || isFieldValidateOnEmpty) && (value === "" || value === null || typeof value === "undefined")) {
        cancelValidation(self, formElmObj);
        deferred.resolve({ isFieldValid: true, formElmObj: formElmObj, value: value });
        return deferred.promise;
      }else {
        formElmObj.isValidationCancelled = false;
      }

      // invalidate field before doing any validation
      if(!!value || self.commonObj.isFieldRequired() || _validateOnEmpty) {
        self.commonObj.ctrl.$setValidity('validation', false);
      }

      // if a field holds invalid characters which are not numbers inside an `input type="number"`, then it's automatically invalid
      // we will still call the `.validate()` function so that it shows also the possible other error messages
      if((value === "" || typeof value === "undefined") && self.commonObj.elm.prop('type').toUpperCase() === "NUMBER") {
        $timeout.cancel(self.timer);
        isValid = self.commonObj.validate(value, true);
        deferred.resolve({ isFieldValid: isValid, formElmObj: formElmObj, value: value });
        return deferred.promise;
      }

      // select(options) will be validated on the spot
      if(self.commonObj.elm.prop('tagName').toUpperCase() === "SELECT") {
        isValid = self.commonObj.validate(value, true);
        self.commonObj.ctrl.$setValidity('validation', isValid);
        deferred.resolve({ isFieldValid: isValid, formElmObj: formElmObj, value: value });
        return deferred.promise;
      }

      // onKeyDown event is the default of Angular, no need to even bind it, it will fall under here anyway
      // in case the field is already pre-filled, we need to validate it without looking at the event binding
      if(typeof value !== "undefined") {
        // when no timer, validate right away without a $timeout. This seems quite important on the array input value check
        if(typingLimit === 0) {
          isValid = self.commonObj.validate(value, true);
          self.commonObj.scope.$evalAsync(self.commonObj.ctrl.$setValidity('validation', isValid ));
          deferred.resolve({ isFieldValid: isValid, formElmObj: formElmObj, value: value });
          $timeout.cancel(self.timer);
        }else {
          // Make the validation only after the user has stopped activity on a field
          // everytime a new character is typed, it will cancel/restart the timer & we'll erase any error mmsg
          self.commonObj.updateErrorMsg('');
          $timeout.cancel(self.timer);
          self.timer = $timeout(function() {
            isValid = self.commonObj.validate(value, true);
            self.commonObj.scope.$evalAsync(self.commonObj.ctrl.$setValidity('validation', isValid ));
            deferred.resolve({ isFieldValid: isValid, formElmObj: formElmObj, value: value });
          }, waitingLimit);
        }
      }

      return deferred.promise;
    } // attemptToValidate()

    /** Cancel current validation test and blank any leftover error message
     * @param object obj
     * @param object formElmObj: form element object
     */
    function cancelValidation(obj, formElmObj) {
      // get the form element custom object and use it after
      var ctrl = (!!formElmObj && !!formElmObj.ctrl) ? formElmObj.ctrl : obj.commonObj.ctrl;

      if(!!formElmObj) {
        formElmObj.isValidationCancelled = true;
      }
      $timeout.cancel(self.timer);
      ctrl.$setValidity('validation', true);
      obj.commonObj.updateErrorMsg('', { isValid: true, obj: formElmObj });

      // unbind onBlur handler (if found) so that it does not fail on a non-required element that is now dirty & empty
      unbindBlurHandler(obj, formElmObj);
    }

    /** watch the element for any value change, validate it once that happen
     * @return new watcher
     */
    function createWatch(scope, attrs, self) {
      return scope.$watch(function() {
        attrs.ctrl = angular.element(attrs.elm).controller('ngModel');

        if(isKeyTypedBadInput(self, attrs.elmName)) {
          return { badInput: true };
        }
        return attrs.ctrl.$modelValue;
      }, function (newValue, oldValue) {
        if(!!newValue && !!newValue.badInput) {
          var formElmObj = self.commonObj.getFormElementByName(attrs.elmName);
          unbindBlurHandler(self, formElmObj);
          return invalidateBadInputField(self, attrs.name);
        }
        // when previous value was set and new value is not, this is most probably an invalid character entered in a type input="text"
        // we will still call the `.validate()` function so that it shows also the possible other error messages
        if(newValue === undefined && (oldValue !== undefined && !isNaN(oldValue))) {
          $timeout.cancel(self.timer);
          self.commonObj.ctrl.$setValidity('validation', self.commonObj.validate('', true));
          return;
        }
        // from the DOM element, find the Angular controller of this element & add value as well to list of attribtues
        attrs.ctrl = angular.element(attrs.elm).controller('ngModel');
        attrs.value = newValue;

        self.commonObj.initialize(scope, attrs.elm, attrs, attrs.ctrl);

        var waitingTimer = (typeof newValue === "undefined" || (typeof newValue === "number" && isNaN(newValue))) ? 0 : undefined;
        // attempt to validate & run validation callback if user requested it
        var validationPromise = attemptToValidate(self, newValue, waitingTimer);
        if(!!_validationCallback) {
          self.commonObj.runValidationCallbackOnPromise(validationPromise, _validationCallback);
        }
      }, true); // $watch()
    }

    /** Invalidate the field that was tagged as bad input, cancel the timer validation,
     * display an invalid key error and add it as well to the validation summary.
     * @param object self
     * @param string: element input name
     */
    function invalidateBadInputField(self, elmName) {
      $timeout.cancel(self.timer);
      var formElmObj = self.commonObj.getFormElementByName(elmName);
      self.commonObj.updateErrorMsg('INVALID_KEY_CHAR', { isValid: false, translate: true, obj: formElmObj });
      self.commonObj.addToValidationSummary(formElmObj, 'INVALID_KEY_CHAR', true);
    }

    /** Was the characters typed by the user bad input or not?
     * @param object self
     * @param string: element input name
     * @return bool
     */
    function isKeyTypedBadInput(self, elmName) {
      var formElmObj = self.commonObj.getFormElementByName(elmName);
      return (!!formElmObj && !!formElmObj.elm.prop('validity') && formElmObj.elm.prop('validity').badInput === true);
    }

    /** Remove a watcher and any withstanding error message from the element
     * @param object self
     * @param object formElmObj: form element object
     * @param object validationSummary
     */
    function removeWatcherAndErrorMessage(self, formElmObj, validationSummary) {
      var scope =
        !!self.commonObj.scope
          ? self.commonObj.scope
          : !!formElmObj.scope
            ? formElmObj.scope
            : null;
      if(typeof scope === "undefined") {
        throw 'removeValidator() requires a valid $scope object passed but unfortunately could not find it.';
      }

      // deregister the $watch from the _watchers array we kept it
      var foundWatcher = self.commonObj.arrayFindObject(_watchers, 'elmName', formElmObj.fieldName);
      if(!!foundWatcher) {
        foundWatcher.watcherHandler(); // deregister the watch by calling his handler
        self.commonObj.arrayRemoveObject(_watchers, 'elmName', formElmObj.fieldName);
      }

      // make the validation cancelled so it won't get called anymore in the blur eventHandler
      formElmObj.isValidationCancelled = true;
      formElmObj.isValid = true;
      formElmObj.attrs.validation = "";
      cancelValidation(self, formElmObj);

      // now to remove any errors, we need to make the element untouched, pristine and remove the validation
      // also remove it from the validationSummary list and remove any displayed error
      if (typeof formElmObj.ctrl.$setUntouched === "function") {
        // make the element untouched in CSS, only works in AngularJS 1.3+
        formElmObj.ctrl.$setUntouched();
      }
      self.commonObj.scope = scope;
      formElmObj.ctrl.$setPristine();
      self.commonObj.removeFromValidationSummary(formElmObj.fieldName, validationSummary);
    }

    /** If found unbind the blur hanlder
     * @param object self
     * @param object formElmObj: form element object
     */
    function unbindBlurHandler(obj, formElmObj) {
      formElmObj.isValidationCancelled = true;
      if(typeof _blurHandler === "function") {
        var elm = (!!formElmObj && !!formElmObj.elm) ? formElmObj.elm : obj.commonObj.elm;
        elm.unbind('blur', _blurHandler);
      }
    }

    /** Watch for an disabled/ngDisabled attribute change,
     * if it become disabled then skip validation else it becomes enable then we need to revalidate it
     * @param object self
     * @param object scope
     * @param object attributes
     */
    function watchNgDisabled(self, scope, attrs) {
      scope.$watch(function() {
        return (typeof attrs.elm.attr('ng-disabled') === "undefined") ? null : scope.$eval(attrs.elm.attr('ng-disabled')); //this will evaluate attribute value `{{}}``
      }, function(disabled) {
        if(typeof disabled === "undefined" || disabled === null) {
          return null;
        }

        // get current ctrl of element & re-initialize to use current element
        attrs.ctrl = angular.element(attrs.elm).controller('ngModel');
        self.commonObj.initialize(scope, attrs.elm, attrs, attrs.ctrl);

        // get the form element custom object and use it after
        var formElmObj = self.commonObj.getFormElementByName(attrs.name);

        // use a timeout so that the digest of removing the `disabled` attribute on the DOM is completed
        // because commonObj.validate() checks for both the `disabled` and `ng-disabled` attribute so it basically fails without the $timeout because of the digest
        $timeout(function() {
          var isDisabled = (disabled === "")
            ? true
            : (typeof disabled === "boolean") ? disabled
              : (typeof disabled !== "undefined") ? scope.$eval(disabled) : false;

          if (isDisabled) {
            // Remove it from validation summary
            attrs.ctrl.$setValidity('validation', true);
            self.commonObj.updateErrorMsg('', { isValid: true, obj: formElmObj });
            self.commonObj.removeFromValidationSummary(attrs.name);
          } else {
            // Re-Validate the input when enabled (without displaying the error)
            var value = attrs.ctrl.$viewValue || '';

            // re-initialize to use current element & validate without delay (without displaying the error)
            self.commonObj.initialize(scope, attrs.elm, attrs, attrs.ctrl);
            attrs.ctrl.$setValidity('validation', self.commonObj.validate(value, false));

            // make sure it's re-enable the validation as well
            if(!!formElmObj) {
              formElmObj.isValidationCancelled = false;
            }

            // re-attach the onBlur handler
            attrs.elm.bind('blur', _blurHandler = function(event) {
              if (!!formElmObj && !formElmObj.isValidationCancelled) {
                // attempt to validate & run validation callback if user requested it
		            var validationPromise = attemptToValidate(self, (attrs.ctrl.$modelValue == undefined ? '' : attrs.ctrl.$modelValue), 10);
                if(!!_validationCallback) {
                  self.commonObj.runValidationCallbackOnPromise(validationPromise, _validationCallback);
                }
              }
            });
          }
        }, 0, false);

        // these cannot be done inside the $timeout, when doing it would cancel validation for all element because of the delay
        if (disabled) {
          // Turn off validation when element is disabled & remove from validationSummary (seems I need to remove from summary inside $timeout and outside)
          // make the element as it was untouched for CSS, only works in AngularJS 1.3+
          if (typeof attrs.ctrl.$setUntouched === "function") {
            attrs.ctrl.$setUntouched();
          }
          attrs.ctrl.$setValidity('validation', true);
          self.commonObj.removeFromValidationSummary(attrs.name);
        }
      });
    }

}]); // ValidationService
