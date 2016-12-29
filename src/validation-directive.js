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
          if (disabled) {
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

            if (!!elm && elm.hasOwnProperty("isValidationCancelled")) {
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
          if(!!value || commonObj.isFieldRequired() || _validateOnEmpty) {
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
          var value = ctrl.$modelValue || '';
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