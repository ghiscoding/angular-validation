/**
 * angular-validation-common (ghiscoding)
 * https://github.com/ghiscoding/angular-validation
 *
 * @author: Ghislain B.
 * @desc: angular-validation common functions used by both the Directive & Service
 * From the outside we will define our complete validation through: defineValidation()
 *
 */
angular
	.module('ghiscoding.validation')
	.factory('validationCommon', ['$timeout', '$translate', 'validationRules', function ($timeout, $translate, validationRules) {
    // global variables
    var timer;
    var bFieldRequired = false; // by default we'll consider our field not required, if validation attribute calls it, then we'll start validating
    var validators = [];
    var validatorAttrs = {};
    var elm;
    var ctrl;
    var scope;
    var value;
    var TYPING_LIMIT = 1000; 
    var typingLimit;

    // service constructor
    var validationCommon = function(scope, elm, attrs, ctrl) {
      this.timer = null;
      this.bFieldRequired = false; // by default we'll consider our field not required, if validation attribute calls it, then we'll start validating
      this.validators = [];
      this.typingLimit = TYPING_LIMIT;
      this.scope = scope;
      this.elm = elm;
      this.ctrl = ctrl;
      this.validatorAttrs = attrs;

      if(!!scope && !!elm && !!attrs && !!ctrl) {
        this.defineValidation();
      }      
    };

    validationCommon.prototype.defineValidation = defineValidation;
    validationCommon.prototype.isFieldRequired = isFieldRequired;
    validationCommon.prototype.initialize = initialize;
    validationCommon.prototype.updateErrorMsg = updateErrorMsg;
    validationCommon.prototype.validate = validate;

		// return the service object
		return validationCommon;

    //----
    // Public functions declaration
    //----------------------------------

    function defineValidation() {   
      var self = this;   
      var customUserRegEx = {};
      self.validators = [];        // reset the global validators
      
      // debounce (alias of typingLimit) timeout after user stop typing and validation comes in play
      self.typingLimit = TYPING_LIMIT;
      if(self.validatorAttrs.hasOwnProperty('debounce')) {
        self.typingLimit = parseInt(self.validatorAttrs.debounce, 10);
      }else if(self.validatorAttrs.hasOwnProperty('typingLimit')) {
        self.typingLimit = parseInt(self.validatorAttrs.typingLimit, 10);
      }
              
      // We first need to see if the validation holds a custom user regex, if it does treat it first
      // So why treat it separately? Because a Regex might hold pipe '|' and so we don't want to mix it with our regular validation pipe
      // Return string will have the complete regex pattern removed but we will keep ':regex' so that we can still loop over it
      var rules = (self.validatorAttrs.hasOwnProperty('rules')) ? self.validatorAttrs.rules : self.validatorAttrs.validation; // inside directive(validation), inside service(rules)
      if(rules.indexOf("regex:") >= 0) {
        var matches = rules.match("regex:(.*?):regex");
        if(matches.length < 2) {
          throw 'Regex validator within the validation needs to be define with an opening "regex:" and a closing ":regex", please review your validator.';
        }
        var regAttrs = matches[1].split(':=');
        customUserRegEx = {
          message: regAttrs[0],
          pattern: regAttrs[1]
        }

        // rewrite the rules so that it doesn't contain the regex: ... :regex ending  
        // we simply remove it so that it won't break if there's a pipe | inside the actual regex
        rules = rules.replace(matches[0], 'regex:');
      } 

      // at this point it's safe to split with pipe (since regex was previously stripped out)
      var validations = rules.split('|');

      if(validations) {
        self.bFieldRequired = (validations.indexOf("required") >= 0) ? true : false;

        // loop through all validators of the element
        for(var i = 0, ln = validations.length; i < ln; i++) {
          var params = validations[i].split(':'); // params[0] is the rule, [1] is the rule extra params
          self.validators[i] = validationRules.getElementValidators(params[0], params[1], customUserRegEx);
        }
      }

      return self;
    }

    /** Initialize the common object */
    function initialize(scope, elm, attrs, ctrl) {
      this.scope = scope;
      this.elm = elm;
      this.ctrl = ctrl;
      this.validatorAttrs = attrs;

      this.defineValidation();
    }
    
    /** @return isFieldRequired */
    function isFieldRequired() {
      var self = this;
      return self.bFieldRequired;
    }

    /** in general we will display error message at the next element after our input as <span class="validation validation-inputName text-danger">
      * but in some cases user might want to define which DOM id to display error (as validation attribute)
      * @param bool isFieldValid: is the field valid?
      * @param string message: error message to display
      */
    function updateErrorMsg(message, isFieldValid, translate) {
      var self = this;

      // Make sure that element has a name="" attribute else it will not work
      if(typeof self.elm.attr('name') === "undefined") {
        throw 'Angular-Validation Service requires you to have a (name="") attribute on the element to validate... Your element is: ng-model="' + self.elm.attr('ng-model') + '"';
      }

      // user might have passed a message to be translated
      var errorMsg = (typeof translate !== "undefined" && translate) ? $translate.instant(message) : message;

      // get the name attribute of current element, make sure to strip dirty characters, for example remove a <input name="options[]"/>, we need to strip the "[]"
      var elmInputName = self.elm.attr('name').replace(/[|&;$%@"<>()+,\[\]\{\}]/g, '');
      var hasValidation = (typeof isFieldValid === "undefined") ? false : true;
      var errorElm = null;

      // find the element which we'll display the error message, this element might be defined by the user with 'validationErrorTo'
      if(self.validatorAttrs.hasOwnProperty('validationErrorTo')) {
        // validationErrorTo can be used in 3 different ways: with '.' (element error className) or with/without '#' (element error id)
        var firstChar = self.validatorAttrs.validationErrorTo.charAt(0);
        var selector = (firstChar === '.' || firstChar === '#') ? self.validatorAttrs.validationErrorTo : '#'+self.validatorAttrs.validationErrorTo;
        errorElm = angular.element(document.querySelector(selector));
      }else {
        // most common way, let's try to find our <span class="validation-inputName">
        errorElm = angular.element(document.querySelector('.validation-'+elmInputName));
      }

      // Re-Render Error display element inside a <span class="validation validation-inputName text-danger">
      if(hasValidation && !isFieldValid && (self.ctrl.$dirty || self.ctrl.$touched)) {
        // invalid & isDirty, display the error message... if <span> not exist then create it, else udpate the <span> text
        (errorElm.length > 0) ? errorElm.text(errorMsg) : self.elm.after('<span class="validation validation-'+elmInputName+' text-danger">'+errorMsg+'</span>');
      }else {
        // element is pristine or there's no validation applied, error message has to be blank
        errorElm.text('');   
      }
    }

    /** Validate function, from the input value it will go through all validators (separated by pipe)
     *  that were passed to the input element and will validate it. If field is invalid it will update
     *  the error text of the span/div element dedicated for that error display.
     * @param string value: value of the input field
     */
    function validate(strValue) {
      var self = this;
      var isValid = true;
      var isFieldValid = true;
      var message = '';
      var regex;      

      // loop through all validators (could be multiple)
      for(var j = 0, jln = self.validators.length; j < jln; j++) {
        if(self.validators[j].type === "conditionalNumber") { 
          // a condition type
          if(self.validators[j].params.length == 2) {
            // this is typically a "between" condition, a range of number >= and <= 
            var isValid1 = testCondition(self.validators[j].condition[0], parseFloat(strValue), parseFloat(self.validators[j].params[0]));
            var isValid2 = testCondition(self.validators[j].condition[1], parseFloat(strValue), parseFloat(self.validators[j].params[1]));
            isValid = (isValid1 && isValid2) ? true : false;
          }else {
            isValid = testCondition(self.validators[j].condition, parseFloat(strValue), parseFloat(self.validators[j].params[0]));
          }
        }else if(self.validators[j].type === "match") {
          // get the element 'value' ngModel to compare to (passed as params[0], via an $eval('ng-model="modelToCompareName"')
          var otherNgModel = self.validators[j].params[0];
          var otherNgModelVal = self.scope.$eval(otherNgModel); 
          isValid = (otherNgModelVal === strValue);
        }else {
          // a 'disabled' element should always be valid, there is no need to validate it
          if(self.elm.prop("disabled")) {
            isValid = true;
          } else {
            // before running Regex test, we'll make sure that an input of type="number" doesn't hold invalid keyboard chars, if true skip Regex
            if(typeof strValue === "string" && strValue === "" && self.elm.prop('type').toUpperCase() === "NUMBER") {
              message = $translate.instant("INVALID_KEY_CHAR");
              isValid = false;
            }else { 
              // run the Regex test through each iteration, if required (\S+) and is null then it's invalid automatically
              regex = new RegExp(self.validators[j].pattern, 'i');
              isValid = (self.validators[j].pattern === "\\S+" && (typeof strValue === "undefined" || strValue === null)) ? false : regex.test(strValue);
            }
          }
        }
        if(!isValid) {
          isFieldValid = false;              
          message += $translate.instant(self.validators[j].message);

          // replace any error message param(s) that were possibly passed              
          if(typeof self.validators[j].params !== "undefined") {
            for(var k = 0, kln = self.validators[j].params.length; k < kln; k++) { 
              if(self.validators[j].type === "match" && kln > 1 && k === 0) {
                // if validation type is "match" and includes more than 1 param, our real text is in param[1], so we need to skip index[0]
                continue;
              }
              message = message.replace((':param'), self.validators[j].params[k]);
            }                
          }
        } // end !isValid
      } // end for() loop

      // -- Error Display --//
      self.updateErrorMsg(message, isFieldValid);

      return isFieldValid;
    } // validate()


	  //----
		// Private functions declaration
		//----------------------------------

    /** Quick function to find an object by it's given field name and value */
    function arrayObjectSearchByField(source, searchField, searchValue) {
      for (var i = 0; i < source.length; i++) {
        if (source[i][searchField] === searchValue) {
          return source[i];
        }
      }
      return null;
    }

    /** Test values with condition, I have created a switch case for all possible conditions.
     * @var String condition: condition to filter with
     * @var any value1: 1st value to compare, the type could be anything (number, String or even Date)
     * @var any value2: 2nd value to compare, the type could be anything (number, String or even Date)
     * @return boolean: a boolean result of the tested condition (true/false)
     */
    function testCondition(condition, value1, value2) {
      var resultCond = false;

      switch (condition) {
        case '<': resultCond = (value1 < value2) ? true : false; break;
        case '<=': resultCond = (value1 <= value2) ? true : false; break;
        case '>': resultCond = (value1 > value2) ? true : false; break;
        case '>=': resultCond = (value1 >= value2) ? true : false; break;
        case '!=':
        case '<>': resultCond = (value1 != value2) ? true : false; break;
        case '=':
        case '==': resultCond = (value1 == value2) ? true : false; break;
        default: resultCond = false; break;
      }
      return resultCond;
    }
}]);