/**
 * angular-validation - v1.0 - 2014-02-07
 * https://github.com/ghiscoding/angular-validation
 * @author: Ghislain B.
 *
 * @desc: If a field becomes invalid, the text inside the error <span> or <div> will show up because the error string gets filled
 * Though when the field becomes valid then the error message becomes an empty string, 
 * it will be transparent to the user even though the <span> still exist but becomes invisible since the text is empty.
 */
 angular.module('ghiscoding.validation', ['pascalprecht.translate'])
  .directive('validation', function($translate) {
    return {
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        // default validation event that triggers the validation error to be displayed
        var DEFAULT_EVENT = "keyup";         // keyup, blur, ...
        
        // get the validation attribute  
        var validationAttr = attrs.validation;

        // define the variables we'll use 
        var messages = [];
        var patterns = [];
        var regexMessage;    
        var regexPattern;
        var validations;       

        // by default we'll consider field not required if not required then no need to validate empty value..right
        // if validation attribute calls it then we'll validate
        var isFieldRequired = false; 
                
        // We first need to see if the validation holds a regex, if it does treat it first
        // So why treat it separately? Because a Regex might hold pipe '|' and so we don't want to mix it with our regular validation pipe
        // Return string will have the complete regex pattern removed but we will keep ':regex' so that we can still loop over it
        if(validationAttr.indexOf("regex:") >= 0) {
          var matches = validationAttr.match("regex:(.*?):regex");
          var regAttrs = matches[1].split(':=');
          regexMessage = regAttrs[0];    
          regexPattern = regAttrs[1];

          // rewrite the validationAttr so that it doesn't contain the regex: ... :regex ending  
          // we simply remove it so that it won't break if there's a pipe | inside the actual regex
          validationAttr = validationAttr.replace(matches[0], 'regex:');
        } 

        // at this point it's safe to split with pipe (since regex was previously stripped out)
        validations = validationAttr.split('|'); 

        if(validations) {
          for(var i = 0, ln = validations.length; i < ln; i++) {
            var params = validations[i].split(':');
            switch(params[0]) {
              case "alpha" :
                patterns[i] = "^([a-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA'
                };
                break;
              case "alphaSpaces" :  
              case "alpha_spaces" :              
                patterns[i] = "^([a-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA_SPACE'
                };
                break;
              case "alphaNum" :  
              case "alpha_num" :
                patterns[i] = "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA_NUM'
                };
                break;
              case "alphaNumSpaces" :
              case "alpha_num_spaces" :
                patterns[i] = "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA_NUM_SPACE'
                };
                break;
              case "alphaDash" :
              case "alpha_dash" :
                patterns[i] = "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ_-])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA_DASH'
                };
                break;
              case "alphaDashSpaces" :
              case "alpha_dash_spaces" :
                patterns[i] = "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s_-])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA_DASH_SPACE'
                };
                break;
              case "betweenLen" :
              case "between_len" :
                var range = params[1].split(',');
                patterns[i] = "^.{" + range[0] + "," + range[1] + "}$";    
                messages[i] = {
                  message: 'INVALID_BETWEEN',
                  params: [range[0], range[1]]
                };             
                break;
              case "creditCard" :
              case "credit_card" :
                patterns[i] = "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})$";
                messages[i] = {
                  message: 'INVALID_CREDIT_CARD'
                };
                break;
              case "dateIso" :
              case "date_iso" :
                patterns[i] = "^(19|20)\\d\\d([-])(0[1-9]|1[012])\\2(0[1-9]|[12][0-9]|3[01])$";
                messages[i] = {
                  message: 'INVALID_DATE_ISO'
                };
                break;  
              case "dateUsLong" :
              case "date_us_long" :
                patterns[i] = "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/](19|20)\\d\\d$";
                messages[i] = {
                  message: 'INVALID_DATE_US_LONG'
                };
                break;
              case "dateUsShort" :
              case "date_us_short" :
                patterns[i] = "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/]\\d\\d$";
                messages[i] = {
                  message: 'INVALID_DATE_US_SHORT'
                };
                break;  
              case "dateEuroLong" :
              case "date_euro_long" :
                patterns[i] = "^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](19|20)\\d\\d$";
                messages[i] = {
                  message: 'INVALID_DATE_EURO_LONG'
                };
                break;  
              case "dateEuroShort" :
              case "date_euro_short" :
                patterns[i] = "^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/]\\d\\d$";
                messages[i] = {
                  message: 'INVALID_DATE_EURO_SHORT'
                };
                break;  
              case "email" :
                patterns[i] = "^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$";
                messages[i] = {
                  message: 'INVALID_EMAIL'
                };
                break;
              case "exactLen" :
              case "exact_len" :
                patterns[i] = "^.{" + params[1] + "}$";                
                messages[i] = {
                  message: 'INVALID_EXACT_LEN',
                  params: [params[1]]
                };
                break; 
              case "float" :
                patterns[i] = "^\\d+[\\.]+\\d+$";
                messages[i] = {
                  message: 'INVALID_FLOAT'
                };
                break;
              case "floatSigned" :
              case "float_signed" :
                patterns[i] = "^[+-]?\\d+[\\.]+\\d+$";
                messages[i] = {
                  message: 'INVALID_FLOAT_SIGNED'
                };
                break;
              case "iban" :
                patterns[i] = "[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{4}[0-9]{7}([a-zA-Z0-9]?){0,16}";
                messages[i] = {
                  message: 'INVALID_IBAN'
                };
                break; 
              case "integer" :
                patterns[i] = "^\\d+$";
                messages[i] = {
                  message: 'INVALID_INTEGER'
                };
                break;
              case "integerSigned" :
              case "integer_signed" :
                patterns[i] = "^[+-]?\\d+$";
                messages[i] = {
                  message: 'INVALID_INTEGER_SIGNED'
                };
                break;              
              case "maxLen" :
              case "max_len" :
                patterns[i] = "^.{0," + params[1] + "}$";                
                messages[i] = {
                  message: 'INVALID_MAX_CHAR',
                  params: [params[1]]
                };
                break;
              case "minLen" :
              case "min_len" :
                patterns[i] = "^.{" + params[1] + ",}$";                
                messages[i] = {
                  message: 'INVALID_MIN_CHAR',
                  params: [params[1]]
                };
                break;
              case "numeric" :
                patterns[i] = "^\\d+[\\.]?\\d*$";
                messages[i] = {
                  message: 'INVALID_NUMERIC'
                };
              case "numeric_signed" :
                patterns[i] = "^[-+]?\\d+[\\.]?\\d*$";
                messages[i] = {
                  message: 'INVALID_NUMERIC_SIGNED'
                };
                break;
              case "regex" :
                // Regex is a special case, the regexMessage & regexPattern variables
                // were created and dealt separately prior to the for loop
                patterns[i] = regexPattern;    
                messages[i] = {
                  message: 'INVALID_PATTERN',
                  params: [regexMessage]
                };
                break;
              case "required" :
                isFieldRequired = true;
                patterns[i] = "\\S+";
                messages[i] = {
                  message: 'INVALID_REQUIRED'
                };
                break;
              case "url" :
                patterns[i] = "(http|ftp|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?";
                messages[i] = {
                  message: 'INVALID_URL'
                };
                break;
            } 
          }          
        }
        
        /** Validate function, from the input value it will go through all validators (separated by pipe)
         *  that were passed to the input element and will validate it. If field is invalid it will update
         *  the error text of the span/div element dedicated for that error display.
         * @param string value: value of the input field
         */
        var validate = function(value) {
          var isValid = true;
          var isFieldValid = true;
          var message = "";
          var regex;          

          // loop through all validations (could be multiple)
          // run the Regex test through each iteration
          for(var j = 0, jln = patterns.length; j < jln; j++) {
            regex = new RegExp(patterns[j], 'i');
            isValid = (patterns[j] === "required" && typeof value === "undefined") ? false : regex.test(value);
            if(!isValid) {
              isFieldValid = false;              
              message += $translate(messages[j].message);              

              // replace any error message params that were passed              
              if(typeof messages[j].params !== "undefined") {
                for(var k = 0, kln = messages[j].params.length; k < kln; k++) { 
                  message = message.replace((':param'), messages[j].params[k]);
                }                
              }

            } // end !isValid
          } // end for loop

          // -- Error Display --//
          updateErrorMsg(isFieldValid, message);
          

          return isFieldValid;
        }

        /** in general we will display error message at the next element after our input
          * but in some cases user want to define which DOM id to display error (as validation attribute)
          * @param bool isFieldValid: is the field valid?
          * @param string message: error message to display
          */
        var updateErrorMsg = function(isFieldValid, message) {
          var errorElm = (typeof attrs.validationErrorTo !== "undefined")
            ? angular.element(document.querySelector('#'+attrs.validationErrorTo))
            : elm.next();

          // Re-Render Error display element inside the <span> or <div>
          if(typeof errorElm !== "undefined") {
            if(!isFieldValid && ctrl.$dirty) {
              // Not valid & dirty, display the message
              errorElm.text(message);
            }else {
              // element is prestine, error message has to be blank
              errorElm.text("");   
            }
          }
        }

        /** Validator function to attach to the element, this will get call whenever the input field is updated
         *  and is also customizable through the (validation-event) which can be (onblur).
         *  If no event is specified, it will validate (onkeyup) as a default action.
         * @param string value: value of the input field
         */
        var validator = function(value) { 
          // if field is not required and his value is empty 
          // then no need to validate & return it valid
          if(!isFieldRequired && (value === "" || typeof value === "undefined")) {
            var isFieldValid = true;
            ctrl.$setValidity('validation', isFieldValid); 
            updateErrorMsg(isFieldValid, "");
            elm.unbind('keyup').unbind('keydown');
            return value;
          }

          // analyze which event we'll use, if nothing was defined then use default
          // also remove prefix substring of 'on' since we don't need it on the 'on' method
          var evnt = (typeof attrs.validationEvent === "undefined") ? DEFAULT_EVENT : attrs.validationEvent;
          evnt = evnt.replace('on', ''); // remove possible 'on' prefix

          // get some properties of the inspected element
          var elmTagName = elm.prop('tagName').toUpperCase();
          var elmType = elm.prop('type').toUpperCase();
          
          // We seem to have little problems validating a field of <input type="number"> 
          // as angular reports undefined value even though user types chars
          // so we'll simply block chars completely except numbers and decimal
          if(elmTagName === "INPUT" && elmType === "NUMBER") {
            elm.bind('keydown', function(evt) {              
              var charCode = (evt.which) ? evt.which : ((typeof event !== "undefined") ? event.keyCode : undefined);
              if(typeof charCode === "undefined") {
                evt.preventDefault();
                return false;
              }
              
              if (charCode > 31 && (charCode != 46 && ((charCode < 48 || charCode > 57) && charCode < 96 || charCode > 105)) && (charCode != 190 && charCode != 110 && charCode != 109 && charCode != 173)) {
                evt.preventDefault();
                return false;
              }else {
                return true;
              }
            });            
          }

          // Also make sure that if user has a select dropdown
          // then we'll validate it has if it was a onBlur event
          // since onKeyUp would fail has there would never be any keyup
          if(elmTagName === "SELECT") {
            if(isFieldRequired && (value === "" || typeof value === "undefined")) {
              // if select option is null or empty string we already know it's invalid
              // but we'll still run validation() to display proper error message
              ctrl.$setValidity('validation', validate(value)); 
              elm.unbind('blur');
              return value;
            }
            // else we'll make sure we use an onBlur event to check validation
            evnt = "blur";
          }
          
          // invalidate field before doing validation 
          ctrl.$setValidity('validation', false); 

          // in case the field is already pre-filled
          // we need to validate it without looking at the event binding
          if(value !== "" && typeof value !== "undefined") {
            var isValid = validate(value);     
            ctrl.$setValidity('validation', isValid);
          }

          // run the validate method on the event
          // update the validation on both the field & form element            
          elm.unbind('keyup').unbind(evnt).bind(evnt, function() {
            // make the regular validation of the field value
            var isValid = validate(value);
            scope.$apply(ctrl.$setValidity('validation', isValid));            
          });  

          return value;        
        };

        // attach the Validator object to the element
        ctrl.$parsers.unshift(validator);
        ctrl.$formatters.unshift(validator);

        // for the case of field that might be ng-disabled, we should skip validation
        // Observe the angular disabled attribute
        attrs.$observe("disabled",function(disabled) {
            if(disabled){
                // Turn off validation when disabled
                ctrl.$setValidity('validation', true);
            } else {
                // Re-Validate the input when enabled
                ctrl.$setValidity('validation', validate(ctrl.$viewValue));
            }
        });
      }
    };
  });