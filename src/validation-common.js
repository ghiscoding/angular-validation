// requires: validation-directive.js

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
	.factory('validationCommon', ['$filter', '$timeout', '$translate', 'validationRules', function ($filter, $timeout, $translate, validationRules) {
    // global variables of our object
    var bFieldRequired = false;   // by default we'll consider our field not required, if validation attribute calls it, then we'll start validating
    var INACTIVITY_LIMIT = 1000;  // constant of maximum user inactivity time limit, this is the default cosntant but can be variable through typingLimit variable

    var elm;                      // element object of current form element
    var ctrl;                     // ctrl object of the current form element
    var scope;                    // scope object of the current form element
    var value;                    // value of current form element
    var timer;                    // timer of user inactivity time
    var typingLimit;              // maximum user inactivity typing limit
    var formElements = [];        // Array of all Form Elements, this is not a DOM Elements, these are custom objects defined as { fieldName, elm,  attrs, ctrl, isValid, message }
    var validators = [];          // Array of all Form Validators
    var validatorAttrs = {};      // Current Validator attributes
    var validationSummary = [];   // Array Validation Error Summary
    var validationSummaries = {}; // Validation Error Summaries separated by Form (could be multiple forms)
    var $translate = $filter('translate');

    // service constructor
    var validationCommon = function(scope, elm, attrs, ctrl) {
      this.timer = null;
      this.bFieldRequired = false; // by default we'll consider our field as not required, if validation attribute calls it, then we'll start validating
      this.validators = [];
      this.typingLimit = INACTIVITY_LIMIT;
      this.scope = scope;
      this.elm = elm;
      this.ctrl = ctrl;
      this.validatorAttrs = attrs;

      // only the angular-validation Directive can possibly reach this condition with all properties filled
      // on the other hand the angular-validation Service will `initialize()` function to initialize the same set of variables
      if(!!scope && !!elm && !!attrs && !!ctrl) {
        addToFormElementObjectList(elm, attrs, ctrl);
        this.defineValidation();
      }
    };

    // list of available published public functions of this object
    validationCommon.prototype.defineValidation = defineValidation;                       // define our validation object
    validationCommon.prototype.getFormElementByName = getFormElementByName;               // get the form element custom object by it's name
    validationCommon.prototype.getFormElements = getFormElements;                         // get the array of form elements (custom objects)
    validationCommon.prototype.isFieldRequired = isFieldRequired;                         // return boolean knowing if the current field is required
    validationCommon.prototype.initialize = initialize;                                   // initialize current object with passed arguments
    validationCommon.prototype.removeFromValidationSummary = removeFromValidationSummary; // remove an element from the $validationSummary
    validationCommon.prototype.updateErrorMsg = updateErrorMsg;                           // update on screen an error message below current form element
    validationCommon.prototype.validate = validate;                                       // validate current element
    validationCommon.prototype.removeFromFormElementObjectList = removeFromFormElementObjectList;  // remove named items from formElements list
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
      self.typingLimit = INACTIVITY_LIMIT;
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
        self.bFieldRequired = (rules.indexOf("required") >= 0) ? true : false;

        // loop through all validators of the element
        for(var i = 0, ln = validations.length; i < ln; i++) {
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
    }

    /** Return a Form element object by it's name
     * @return array object elements
     */
    function getFormElementByName(elmName) {
      return arrayFindObject(formElements, 'fieldName', elmName);
    }

    /** Return all Form elements
     * @return array object elements
     */
    function getFormElements() {
      return formElements;
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

      addToFormElementObjectList(elm, attrs, ctrl);
      this.defineValidation();
    }

    /** @return isFieldRequired */
    function isFieldRequired() {
      var self = this;
      return self.bFieldRequired;
    }

    /** Remove an element from the $validationSummary array
     * @param object validationSummary
     * @param string elmName: element name
     */
    function removeFromValidationSummary(validationSummaryObj, elmName) {
      var index = arrayFindObjectIndex(validationSummaryObj, 'field', elmName); // find index of object in our array
      // if message is empty, remove it from the validation summary object
      if(index >= 0) {
        validationSummaryObj.splice(index, 1);
      }
     // also remove from 'local' validationSummary
     index = arrayFindObjectIndex(validationSummary, 'field', elmName); // find index of object in our array
     if(index >= 0) {
        validationSummary.splice(index, 1);
      }
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
      if(typeof elmName === "undefined" || elmName === null) {
        throw 'Angular-Validation Service requires you to have a (name="") attribute on the element to validate... Your element is: ng-model="' + elm.attr('ng-model') + '"';
      }

      // user might have passed a message to be translated
      var errorMsg = (!!attrs && !!attrs.translate) ? $translate(message) : message;

      // get the name attribute of current element, make sure to strip dirty characters, for example remove a <input name="options[]"/>, we need to strip the "[]"
      var elmInputName = elmName.replace(/[|&;$%@"<>()+,\[\]\{\}]/g, '');
      var errorElm = null;

      // find the element which we'll display the error message, this element might be defined by the user with 'validationErrorTo'
      if(!!self.validatorAttrs && self.validatorAttrs.hasOwnProperty('validationErrorTo')) {
        // validationErrorTo can be used in 3 different ways: with '.' (element error className) or with/without '#' (element error id)
        var firstChar = self.validatorAttrs.validationErrorTo.charAt(0);
        var selector = (firstChar === '.' || firstChar === '#') ? self.validatorAttrs.validationErrorTo : '#'+self.validatorAttrs.validationErrorTo;
        errorElm = angular.element(document.querySelector(selector));
      }
      // errorElm can be empty due to:
      //  1. validationErrorTo has not been set
      //  2. validationErrorTo has been mistyped, and if mistyped, use regular functionality
      if(!errorElm || errorElm.length === 0){
        // most common way, let's try to find our <span class="validation-inputName">
        errorElm = angular.element(document.querySelector('.validation-'+elmInputName));
      }

      // form might have already been submitted
      var isSubmitted = (!!attrs && attrs.isSubmitted) ? attrs.isSubmitted : false;

      // invalid & isDirty, display the error message... if <span> not exist then create it, else udpate the <span> text
      if(!!attrs && !attrs.isValid && (isSubmitted || self.ctrl.$dirty || self.ctrl.$touched)) {
        (errorElm.length > 0) ? errorElm.text(errorMsg) : elm.after('<span class="validation validation-'+elmInputName+' text-danger">'+errorMsg+'</span>');
      }else {
        errorElm.text('');  // element is pristine or no validation applied, error message has to be blank
      }
    }

    /** Validate function, from the input value it will go through all validators (separated by pipe)
     *  that were passed to the input element and will validate it. If field is invalid it will update
     *  the error text of the span/div element dedicated for that error display.
     * @param string value: value of the input field
     * @param bool showError: do we want to show the error or hide it (false is useful for adding error to $validationSummary without displaying it on screen)
     * @return bool isValid
     */
    function validate(strValue, showError) {
      var self = this;
      var isFieldValid = true;
      var isValid = true;
      var message = '';
      var regex;

      // loop through all validators (could be multiple)
      for(var j = 0, jln = self.validators.length; j < jln; j++) {
        if(self.validators[j].type === "conditionalDate") {
          // 1- we first need to validate that the Date input is well formed through regex
          // run the Regex test through each iteration, if required (\S+) and is null then it's invalid automatically
          regex = new RegExp(self.validators[j].pattern, 'i');
          isValid = (self.validators[j].pattern === "\\S+" && (typeof strValue === "undefined" || strValue === null)) ? false : regex.test(strValue);

          // 2- date is valid, then we can do our conditional date check
          if(isValid) {
            // For Date comparison, we will need to construct a Date Object that follows the ECMA so then it could work in all browser
            // Then convert to timestamp & finally we can compare both dates for filtering
            var dateType = self.validators[j].dateType;                   // date type (ISO, EURO, US-SHORT, US-LONG)
            var timestampValue = parseDate(strValue, dateType).getTime(); // our input value parsed into a timestamp

            // if 2 params, then it's a between condition
            if(self.validators[j].params.length == 2) {
              // this is typically a "between" condition, a range of number >= and <=
              var timestampParam0 = parseDate(self.validators[j].params[0], dateType).getTime();
              var timestampParam1 = parseDate(self.validators[j].params[1], dateType).getTime();
              var isValid1 = testCondition(self.validators[j].condition[0], timestampValue, timestampParam0);
              var isValid2 = testCondition(self.validators[j].condition[1], timestampValue, timestampParam1);
              isValid = (isValid1 && isValid2) ? true : false;
            }else {
              // else, 1 param is a simple conditional date check
              var timestampParam = parseDate(self.validators[j].params[0], dateType).getTime();
              isValid = testCondition(self.validators[j].condition, timestampValue, timestampParam);
            }
          }
        }
        // it might be a conditional number checking
        else if(self.validators[j].type === "conditionalNumber") {
          // if 2 params, then it's a between condition
          if(self.validators[j].params.length == 2) {
            // this is typically a "between" condition, a range of number >= and <=
            var isValid1 = testCondition(self.validators[j].condition[0], parseFloat(strValue), parseFloat(self.validators[j].params[0]));
            var isValid2 = testCondition(self.validators[j].condition[1], parseFloat(strValue), parseFloat(self.validators[j].params[1]));
            isValid = (isValid1 && isValid2) ? true : false;
          }else {
            // else, 1 param is a simple conditional number check
            isValid = testCondition(self.validators[j].condition, parseFloat(strValue), parseFloat(self.validators[j].params[0]));
          }
        }
        // it might be a match input checking
        else if(self.validators[j].type === "match") {
          // get the element 'value' ngModel to compare to (passed as params[0], via an $eval('ng-model="modelToCompareName"')
          var otherNgModel = self.validators[j].params[0];
          var otherNgModelVal = self.scope.$eval(otherNgModel);
          isValid = (otherNgModelVal === strValue);
        }
        // or finally it might be a regular regex pattern checking
        else {
          // a 'disabled' element should always be valid, there is no need to validate it
          if(self.elm.prop("disabled") || parseInt(self.elm.attr("ng-disabled")) == true || self.elm.attr("ng-disabled") === "true") {
            isValid = true;
          } else {
            // before running Regex test, we'll make sure that an input of type="number" doesn't hold invalid keyboard chars, if true skip Regex
            if(typeof strValue === "string" && strValue === "" && self.elm.prop('type').toUpperCase() === "NUMBER") {
              message = $translate("INVALID_KEY_CHAR");
              isValid = false;
            }else {
              // run the Regex test through each iteration, if required (\S+) and is null then it's invalid automatically
              regex = new RegExp(self.validators[j].pattern, 'i');
              isValid = (self.validators[j].pattern === "\\S+" && (typeof strValue === "undefined" || strValue === null)) ? false : regex.test(strValue);
            }
          }
        }

        // not required and not filled is always valid & 'disabled', 'ng-disabled' elements should always be valid
        if( (!self.bFieldRequired && !strValue) || (self.elm.prop("disabled") || parseInt(self.elm.attr("ng-disabled")) == true || self.elm.attr("ng-disabled") === "true") ) {
          isValid = true;
        }

        if(!isValid) {
          isFieldValid = false;

          // add a space before next error message, if alternate text is found we will use it instead of regular message
          message += ' ';
          message += (!!self.validators[j].altText && self.validators[j].altText.length > 0)
            ? self.validators[j].altText.replace("alt=", "")
            : $translate(self.validators[j].message);

          // replace any error message param(s) that were possibly passed
          if(typeof self.validators[j].params !== "undefined") {
            for(var k = 0, kln = self.validators[j].params.length; k < kln; k++) {
              // if validation type is "match" and includes more than 1 param, our real text is in param[1], so we need to skip index[0]
              if(self.validators[j].type === "match" && kln > 1 && k === 0) {
                continue;
              }
              message = message.replace((':param'), self.validators[j].params[k]);
            }
          }
        }
      } // for() loop

      // remove any trailing spaces
      message = message.trim();

      // only log the invalid message in the $validationSummary
      addToValidationSummary(self, $translate(message));

      // change the Form element object boolean flag from the `formElements` variable
      var formElmObj = getFormElementByName(self.elm.attr('name'));
      if(!!formElmObj) {
        formElmObj.isValid = isValid;
        formElmObj.message = $translate(message);
      }

      // error Display
      if(showError) {
        self.updateErrorMsg(message, { isValid: isFieldValid });
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
    function addToFormElementObjectList(elm, attrs, ctrl) {
      var formElm = { fieldName: elm.attr('name'), elm: elm, attrs: attrs, ctrl: ctrl, isValid: false, message: '' };
      var index = arrayFindObjectIndex(formElements, 'fieldName', elm.attr('name')); // find index of object in our array
      if(index >= 0) {
        formElements[index] = formElm;
      }else {
        formElements.push(formElm);
      }
      return formElements;
    }

    /** Remove objects from FormElement list.
     * @param elementName to remove
     */
    function removeFromFormElementObjectList(elmName) {
      var index = arrayFindObjectIndex(formElements, 'fieldName', elmName); // find index of object in our array
      if (index >= 0) {
        formElements.splice(index, 1);
      }
    }

    /** Add the error to the validation summary
     * @param object self
     * @param string message: error message
     */
    function addToValidationSummary(self, message) {
      var elmName = self.elm.attr('name');
      var form = getElementParentForm(self);                                  // find the parent form (only found if it has a name)
      var index = arrayFindObjectIndex(validationSummary, 'field', elmName);  // find index of object in our array

      // if message is empty, remove it from the validation summary
      if(index >= 0 && message === '') {
        validationSummary.splice(index, 1);
      }else if(message !== '') {
        var errorObj = { field: elmName, message: message, formName: (!!form) ? form.$name : null };

        // if error already exist then refresh the error object inside the array, else push it to the array
        if(index >= 0) {
          validationSummary[index] = errorObj;
        }else {
          validationSummary.push(errorObj);
        }
      }

      // save validation summary scope root
      self.scope.$validationSummary = validationSummary;

      // and also save it inside the current scope form (if found)
      if (!!form) {
        // since validationSummary contain errors of all forms
        // we need to find only the errors of current form and them into the current scope form object
        form.$validationSummary = arrayFindObjects(validationSummary, 'formName', form.$name);
      }
    }

    /** Quick function to find an object inside an array by it's given field name and value, return the object found or null
     * @param Array sourceArray
     * @param string searchId: search property id
     * @param string searchValue: value to search
     * @return object found from source array or null
     */
    function arrayFindObject(sourceArray, searchId, searchValue) {
      for (var i = 0; i < sourceArray.length; i++) {
        if (sourceArray[i][searchId] === searchValue) {
          return sourceArray[i];
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
      for (var i = 0; i < sourceArray.length; i++) {
        if (sourceArray[i][searchId] === searchValue) {
          results.push(sourceArray[i]);
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
      for (var i = 0; i < sourceArray.length; i++) {
        if (sourceArray[i][searchId] === searchValue) {
          return i;
        }
      }
      return -1;
    }

    /** Get the element's parent Angular form (if found)
     * @param object self
     * @return object scope form
     */
    function getElementParentForm(self) {
      // from the element passed, get his parent form
      var elmName = self.elm.attr('name');
      var forms = document.getElementsByName(elmName);

      for (var i = 0; i < forms.length; i++) {
        var form = forms[i].form;
        if (!!form && form.name && self.scope[form.name]) {
          return self.scope[form.name];
        }
      }
      return null;
    }

    /** Get form within scope (if found)
    * @param object self
    * @return object scope form
    */
    function getScopeForm(self) {
      var forms = document.querySelectorAll('form');
      for (var i = 0; i < forms.length; i++) {
        var form = document.querySelectorAll('form')[i];
        if (form && form.name && self.scope[form.name]) {
          return self.scope[form.name];
        }
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