/**
 * angular-validation - v1.0 - 2014-02-02
 * https://github.com/ghiscoding/angular-validation
 */
 angular.module('ghiscoding.validation', ['pascalprecht.translate'])
  .directive('ngxValidation',function($translate){
    return{
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        // get the ngx-validation attribute  
        var validationAttr = attrs.ngxValidation;

        // define the variables we'll use 
        var messages = [];
        var patterns = [];
        var regexMessage;    
        var regexPattern;
        var validations;
        
        
        // We first need to see if the validation holds a regex, if it does treat it first
        // So why treat it separately? Because a Regex might hold pipe '|' and so we don't want to mix it with our regular validation pipe
        // Return string will have the complete regex pattern removed but we will keep ':regex' so that we can still loop over it
        if(validationAttr.indexOf("regex:") >= 0) {
          var matches = validationAttr.match("regex:(.*?):regex");
          var regAttrs = matches[1].split(':=');
          regexMessage = regAttrs[0];    
          regexPattern = regAttrs[1];

          // rewrite the validationAttr so that it doesn't have the regex: ... :regex ending  
          validationAttr = validationAttr.replace(matches[0], 'regex:');
        } 

        // at this point it's safe to split with pipe (regex was previously stripped out)
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
              case "alpha_num" :
                patterns[i] = "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA_NUMERIC'
                };
                break;
              case "alpha_dash" :
                patterns[i] = "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ_-])+$";
                messages[i] = {
                  message: 'INVALID_ALPHA_DASH'
                };
                break;
              case "between_len" :
                var range = params[1].split(',');
                patterns[i] = "^.{" + range[0] + "," + range[1] + "}$";    
                messages[i] = {
                  message: 'INVALID_BETWEEN',
                  params: [range[0], range[1]]
                };             
                break;
              case "credit_card" :
                patterns[i] = "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})$";
                messages[i] = {
                  message: 'INVALID_CREDIT_CARD'
                };
                break;
              case "date_iso" :
                patterns[i] = "^(19|20)\\d\\d([-])(0[1-9]|1[012])\\2(0[1-9]|[12][0-9]|3[01])$";
                messages[i] = {
                  message: 'INVALID_DATE_ISO'
                };
                break;  
              case "date_us_long" :
                patterns[i] = "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/](19|20)\\d\\d$";
                messages[i] = {
                  message: 'INVALID_DATE_US_LONG'
                };
                break;
              case "date_us_short" :
                patterns[i] = "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/]\\d\\d$";
                messages[i] = {
                  message: 'INVALID_DATE_US_SHORT'
                };
                break;  
              case "date_euro_long" :
                patterns[i] = "^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](19|20)\\d\\d$";
                messages[i] = {
                  message: 'INVALID_DATE_EURO_LONG'
                };
                break;  
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
              case "exact_len" :
                patterns[i] = "^.{" + params[1] + "}$";                
                messages[i] = {
                  message: 'INVALID_EXACT_LEN',
                  params: [params[1]]
                };
                break;  
              case "integer" :
                patterns[i] = "^[-+]?\\d+$";
                messages[i] = {
                  message: 'INVALID_INTEGER'
                };
                break;              
              case "max_len" :
                patterns[i] = "^.{0," + params[1] + "}$";                
                messages[i] = {
                  message: 'INVALID_MAX_CHAR',
                  params: [params[1]]
                };
                break;
              case "min_len" :
                patterns[i] = "^.{" + params[1] + ",}$";                
                messages[i] = {
                  message: 'INVALID_MIN_CHAR',
                  params: [params[1]]
                };
                break;
              case "numeric" :
                patterns[i] = "^[-+]?\\d+[\\.]?\\d*$";
                messages[i] = {
                  message: 'INVALID_NUMERIC'
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
        
        // From angular get the value of the Form and loop through all existing validation defined
        var validator = function(value) {          
          var isValid = true;
          var isFieldValid = true;
          var message = "";
          var regex;          

          // loop through all validations (could be multiple)
          // run the Regex test through each iteration
          for(var j = 0, jln = patterns.length; j < jln; j++) {
            regex = new RegExp(patterns[j], 'i');
            isValid = regex.test(value);
            if(!isValid) {
              isFieldValid = false;              
              message += $translate(messages[j].message);              

              // replace any error message params that were passed              
              if(typeof messages[j].params !== "undefined") {
                for(var k = 0, kln = messages[j].params.length; k < kln; k++) { 
                  message = message.replace((':param'), messages[j].params[k]);
                }                
              }
            }
          }
          
          ctrl.$setValidity('ngxValidation', isFieldValid);

          if(!isFieldValid && ctrl.$dirty) {
            scope.validation_errors[ctrl.$name] = message;
          }else {
            scope.validation_errors[ctrl.$name] = "";
          }

          return value;
        };

        ctrl.$parsers.unshift(validator);
        ctrl.$formatters.unshift(validator);
      }
    };
  });