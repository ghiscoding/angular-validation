/**
 * angular-validation-rules (ghiscoding)
 * https://github.com/ghiscoding/angular-validation
 *
 * @author: Ghislain B.
 * @desc: angular-validation rules definition
 * Each rule objects must have 3 properties {pattern, message, type}
 * and in some cases you could also define a 4th properties {params} to pass extras, for example: max_len will know his maximum length by this extra {params}
 * Rule.type can be {conditionalNumber, match, regex}
 *
 * WARNING: Rule patterns are defined as String type so don't forget to escape your characters: \\
 */
angular
	.module('ghiscoding.validation')
	.factory('validationRules', [function () {
		// return the service object
		var service = {
	    getElementValidators: getElementValidators
	  };
	  return service;

	  //----
		// Functions declaration
		//----------------------------------

		/** Get the element active validators and store it inside an array which will be returned 
		 * @param string rule: rule name
		 * @param string ruleParam: rule extra parameter
		 * @param object customUserRegEx: custom Regex defined by the user (*optional)
		 * @return object validator
		 */
		function getElementValidators(rule, ruleParam, customUserRegEx) {
			// validators on the current DOM element, an element can have 1+ validators
			var validator = {};

      switch(rule) {
        case "alpha" :
          validator = {
            pattern: "^([a-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ])+$",
            message: "INVALID_ALPHA",
            type: "regex"
          };
          break;
        case "alphaSpaces" :  
        case "alpha_spaces" :   
          validator = {
            pattern: "^([a-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s])+$",
            message: "INVALID_ALPHA_SPACE",
            type: "regex"
          };
          break;
        case "alphaNum" :  
        case "alpha_num" :
          validator = {
            pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ])+$",
            message: "INVALID_ALPHA_NUM",
            type: "regex"
          };
          break;
        case "alphaNumSpaces" :
        case "alpha_num_spaces" :
          validator = {
            pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s])+$",
            message: "INVALID_ALPHA_NUM_SPACE",
            type: "regex"
          };
          break;
        case "alphaDash" :
        case "alpha_dash" :
          validator = {
            pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ_-])+$",
            message: "INVALID_ALPHA_DASH",
            type: "regex"
          };
          break;
        case "alphaDashSpaces" :
        case "alpha_dash_spaces" :
          validator = {
            pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s_-])+$",
            message: "INVALID_ALPHA_DASH_SPACE",
            type: "regex"
          };
          break;
        case "betweenLen" :
        case "between_len" :
          var range = ruleParam.split(',');
          if (range.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_len:1,5";
          }
          validator = {
            pattern: "^.{" + range[0] + "," + range[1] + "}$",
            message: "INVALID_BETWEEN_CHAR",
            params: [range[0], range[1]],
            type: "regex"
          };        
          break;
        case "betweenNum" :
        case "between_num" :
          var range = ruleParam.split(',');
          if (range.length !== 2) {
            throw "This validation must include exactly 2 params separated by a comma (,) ex.: between_num:1,5";
          }
          validator = {
            condition: [">=","<="],
            message: "INVALID_BETWEEN_NUM",
            params: [range[0], range[1]],
            type: "conditionalNumber"
          };
          break;
        case "creditCard" :
        case "credit_card" :
          validator = {
            pattern: "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})$",
            message: "INVALID_CREDIT_CARD",
            type: "regex"
          };
          break;
        case "dateIso" :
        case "date_iso" :
          validator = {
            pattern: "^(19|20)\\d\\d([-])(0[1-9]|1[012])\\2(0[1-9]|[12][0-9]|3[01])$",
            message: "INVALID_DATE_ISO",
            type: "regex"
          };
          break;  
        case "dateUsLong" :
        case "date_us_long" :
          validator = {
            pattern: "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/](19|20)\\d\\d$",
            message: "INVALID_DATE_US_LONG",
            type: "regex"
          };
          break;
        case "dateUsShort" :
        case "date_us_short" :
          validator = {
            pattern: "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/]\\d\\d$",
            message: "INVALID_DATE_US_SHORT",
            type: "regex"
          };
          break;  
        case "dateEuroLong" :
        case "date_euro_long" :
          validator = {
            pattern: "^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](19|20)\\d\\d$",
            message: "INVALID_DATE_EURO_LONG",
            type: "regex"
          };
          break;  
        case "dateEuroShort" :
        case "date_euro_short" :
          validator = {
            pattern: "^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/]\\d\\d$",
            message: "INVALID_DATE_EURO_SHORT",
            type: "regex"
          };
          break;  
        case "email" :
          validator = {
            pattern: "^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$",
            message: "INVALID_EMAIL",
            type: "regex"
          };
          break;
        case "exactLen" :
        case "exact_len" :
          validator = {
            pattern: "^.{" + ruleParam + "}$",
            message: "INVALID_EXACT_LEN",
            params: [ruleParam],
            type: "regex"                  
          };
          break; 
        case "float" :
          validator = {
            pattern: "^\\d*\\.{1}\\d+$",
            message: "INVALID_FLOAT",
            type: "regex"
          };
          break;
        case "floatSigned" :
        case "float_signed" :
          validator = {
            pattern: "^[-+]?\\d*\\.{1}\\d+$",
            message: "INVALID_FLOAT_SIGNED",
            type: "regex"
          };
          break;
        case "iban" :
          validator = {
            pattern: "[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{4}[0-9]{7}([a-zA-Z0-9]?){0,16}",
            message: "INVALID_IBAN",
            type: "regex"
          };
          break; 
        case "int" :
        case "integer" :
          validator = {
            pattern: "^\\d+$",
            message: "INVALID_INTEGER",
            type: "regex"
          };
          break;
        case "intSigned" :
        case "integerSigned" :
        case "int_signed" :
        case "integer_signed" :
          validator = {
            pattern: "^[+-]?\\d+$",
            message: "INVALID_INTEGER_SIGNED",
            type: "regex"
          };
          break; 
        case "ipv4" :
          validator = {
            pattern: "^(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)){3}$",
            message: "INVALID_IPV4",
            type: "regex"
          };
          break; 
        case "ipv6" :
          validator = {
            pattern: "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",
            message: "INVALID_IPV6",
            type: "regex"
          };
          break; 
        case "ipv6_hex" :
          validator = {
            pattern: "^((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)::((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)$",
            message: "INVALID_IPV6_HEX",
            type: "regex"
          };
          break; 
        case "match" :
          var args = ruleParam.split(',');
          validator = {
            message: "INVALID_INPUT_MATCH",
            params: args,
            type: "match"
          };
          break;
        case "maxLen" :
        case "max_len" :
          validator = {
            pattern: "^.{0," + ruleParam + "}$",
            message: "INVALID_MAX_CHAR",
            params: [ruleParam],
            type: "regex"
          };
          break;
        case "maxNum" :
        case "max_num" :
          validator = {
            condition: "<=",
            message: "INVALID_MAX_NUM",
            params: [ruleParam],
            type: "conditionalNumber"
          };
          break;
        case "minLen" :
        case "min_len" :
          validator = {
            pattern: "^.{" + ruleParam + ",}$",
            message: "INVALID_MIN_CHAR",
            params: [ruleParam],
            type: "regex"
          };
          break;
        case "minNum" :
        case "min_num" :
          validator = {
            condition: ">=",
            message: "INVALID_MIN_NUM",
            params: [ruleParam],
            type: "conditionalNumber"
          };
          break; 
        case "numeric" :
          validator = {
            pattern: "^\\d*\\.?\\d+$",
            message: "INVALID_NUMERIC",
            type: "regex"
          };
          break; 
        case "numericSigned" :
        case "numeric_signed" :
          validator = {
            pattern: "^[-+]?\\d*\\.?\\d+$",
            message: "INVALID_NUMERIC_SIGNED",
            type: "regex"
          };
          break;
        case "regex" :
          // Custom User Regex is a special case, the properties (message, pattern) were created and dealt separately prior to the for loop
          validator = {
            pattern: customUserRegEx.pattern,
            message: "INVALID_PATTERN",
            params: [customUserRegEx.message],
            type: "regex"
          };
          break;
        case "required" :
          validator = {
            pattern: "\\S+",
            message: "INVALID_REQUIRED",
            type: "regex"
          };
          break;
        case "url" :
          validator = {
            pattern: "(http|ftp|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?",
            message: "INVALID_URL",
            type: "regex"
          };
          break;
        case "time" :
          validator = {
            pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
            message: "INVALID_TIME",
            type: "regex"
          };
          break;
      } // switch() 

	    return validator;
		} // getElementValidators()
}]);