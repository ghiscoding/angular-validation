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
      if (!!self.validationAttrs.isolatedScope) {
        var tempValidationOptions = scope.$validationOptions || null; // keep global validationOptions
        scope = self.validationAttrs.isolatedScope;                   // rewrite original scope
        if(!!tempValidationOptions) {
          scope.$validationOptions = tempValidationOptions;           // reuse the validationOption from original scope
        }
      }

      // Possible element attributes
      _validationCallback = (self.validationAttrs.hasOwnProperty('validationCallback')) ? self.validationAttrs.validationCallback : null;
      _validateOnEmpty = (self.validationAttrs.hasOwnProperty('validateOnEmpty')) ? commonObj.parseBool(self.validationAttrs.validateOnEmpty) : !!_globalOptions.validateOnEmpty;

      // onBlur make validation without waiting
      attrs.elm.bind('blur', _blurHandler = function(event) {
        // get the form element custom object and use it after
        var formElmObj = self.commonObj.getFormElementByName(attrs.elmName);

        if (!!formElmObj && !formElmObj.isValidationCancelled) {
          // re-initialize to use current element & validate without delay
          self.commonObj.initialize(scope, attrs.elm, attrs, attrs.ctrl);

          // attempt to validate & run validation callback if user requested it
          var validationPromise = attemptToValidate(self, event.target.value, 0);
          if(!!_validationCallback) {
            self.commonObj.runValidationCallbackOnPromise(validationPromise, _validationCallback);
          }
        }
      });

      // merge both attributes but 2nd object (attrs) as higher priority, so that for example debounce property inside `attrs` as higher priority over `validatorAttrs`
      // so the position inside the mergeObject call is very important
      attrs = self.commonObj.mergeObjects(self.validationAttrs, attrs);

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
     * @return bool isFormValid
     */
    function checkFormValidity(obj) {
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
            if (typeof formElmObj.ctrl.$setTouched === "function") {
              formElmObj.ctrl.$setTouched();
            }
            self.commonObj.updateErrorMsg(obj.$validationSummary[i].message, { isSubmitted: true, isValid: formElmObj.isValid, obj: formElmObj });
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

      // if field is not required and his value is empty, cancel validation and exit out
      if(!self.commonObj.isFieldRequired() && !_validateOnEmpty && (value === "" || value === null || typeof value === "undefined")) {
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
        _watchers.shift();
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
          if (disabled) {
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
                var validationPromise = attemptToValidate(self, event.target.value, 10);
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