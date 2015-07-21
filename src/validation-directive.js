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
  .directive('validation', ['$timeout', 'validationCommon', function($timeout, validationCommon) {
    return {
      restrict: "A",
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        // create an object of the common validation
        var commonObj = new validationCommon(scope, elm, attrs, ctrl);
        var timer;
        var blurHandler;
        var isValidationCancelled = false;

        // construct the functions, it's just to make the code cleaner and put the functions at bottom
        var construct = {
          attemptToValidate: attemptToValidate,
          cancelValidation : cancelValidation
        }

        // attach the attemptToValidate function to the element
        ctrl.$formatters.unshift(attemptToValidate);
        ctrl.$parsers.unshift(attemptToValidate);

        // watch the `disabled` attribute for changes
        // if it become disabled then skip validation else it becomes enable then we need to revalidate it
        attrs.$observe("disabled", function(disabled) {
          if (disabled) {
            // Turn off validation when element is disabled & remove it from validation summary
            cancelValidation();
            commonObj.removeFromValidationSummary(attrs.name);
          } else {
            // make the element as it was touched for CSS, only works in AngularJS 1.3+
            if (typeof ctrl.$setTouched === "function") {
              ctrl.$setTouched();
            }

            // Re-Validate the input when enabled
            var value = ctrl.$viewValue || '';
            ctrl.$setValidity('validation', commonObj.validate(value, true));
          }
        });

        // watch for a validation becoming empty, if that is the case, unbind everything from it
        scope.$watch(function() {
          return elm.attr('validation');
        }, function(validation) {
          if(typeof validation === "undefined" || validation === '') {
            // unbind everything and cancel the validation
            ctrl.$formatters.shift();
            ctrl.$parsers.shift();
            cancelValidation();
          }
        });

        // onBlur make validation without waiting
        elm.bind('blur', blurHandler = function(event) {
          // get the form element custom object and use it after
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);

          if (!formElmObj.isValidationCancelled) {
            // validate without delay
            attemptToValidate(event.target.value, 10);
          }else {
            ctrl.$setValidity('validation', true);
          }
        });

        //----
        // Private functions declaration
        //----------------------------------

        /** Cancel current validation test and blank any leftover error message */
        function cancelValidation() {
          // get the form element custom object and use it after
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);

          formElmObj.isValidationCancelled = true;
          $timeout.cancel(timer);
          commonObj.updateErrorMsg('');
          ctrl.$setValidity('validation', true);

          // unbind onBlur handler (if found) so that it does not fail on a non-required element that is now dirty & empty
          if(typeof blurHandler === "function") {
            elm.unbind('blur', blurHandler);
          }
        }

        /** Validator function to attach to the element, this will get call whenever the input field is updated
         *  and is also customizable through the (typing-limit) for which inactivity this.timer will trigger validation.
         * @param string value: value of the input field
         */
        function attemptToValidate(value, typingLimit) {
          // get the waiting delay time if passed as argument or get it from common Object
          var waitingLimit = (typeof typingLimit !== "undefined") ? typingLimit : commonObj.typingLimit;

          // get the form element custom object and use it after
          var formElmObj = commonObj.getFormElementByName(ctrl.$name);

          // pre-validate without any events just to pre-fill our validationSummary with all field errors
          // passing false as 2nd argument for not showing any errors on screen
          commonObj.validate(value, false);

          // if field is not required and his value is empty, cancel validation and exit out
          if(!commonObj.isFieldRequired() && (value === "" || value === null || typeof value === "undefined")) {
            cancelValidation();
            return value;
          }else if(!!formElmObj) {
            formElmObj.isValidationCancelled = false;
          }

          // invalidate field before doing any validation
          if(!!value || commonObj.isFieldRequired()) {
            ctrl.$setValidity('validation', false);
          }

          // if a field holds invalid characters which are not numbers inside an `input type="number"`, then it's automatically invalid
          // we will still call the `.validate()` function so that it shows also the possible other error messages
          if((value === "" || typeof value === "undefined") && elm.prop('type').toUpperCase() === "NUMBER") {
            $timeout.cancel(timer);
            ctrl.$setValidity('validation', commonObj.validate(value, true));
            return value;
          }

          // select(options) will be validated on the spot
          if(elm.prop('tagName').toUpperCase() === "SELECT") {
            ctrl.$setValidity('validation', commonObj.validate(value, true));
            return value;
          }

          // onKeyDown event is the default of Angular, no need to even bind it, it will fall under here anyway
          // in case the field is already pre-filled, we need to validate it without looking at the event binding
          if(typeof value !== "undefined") {
            // Make the validation only after the user has stopped activity on a field
            // everytime a new character is typed, it will cancel/restart the timer & we'll erase any error mmsg
            commonObj.updateErrorMsg('');
            $timeout.cancel(timer);
            timer = $timeout(function() {
              scope.$evalAsync(ctrl.$setValidity('validation', commonObj.validate(value, true) ));
            }, waitingLimit);
          }

          return value;
        } // attemptToValidate()

      } // link()
    }; // return;
  }]); // directive