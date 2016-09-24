describe('Angular-Validation Mixed Tests:', function () {
  // global variables
  var formElementNames = ['input2', 'input3', 'input4', 'input5', 'input6', 'input7', 'input8', 'input9', 'input10', 'input11', 'input12', 'select1', 'input13', 'input14', 'input15', 'input16', 'input17', 'input18', 'input19', 'input20', 'input21', 'area1'];
  var formElementSummaryNames = ['input2', 'input3', 'input4', 'Email', 'input6', 'input7', 'Credit Card', 'input9', 'input10', 'input11', 'select1', 'input13', 'input15', 'input16', 'input17', 'input18', 'input19', 'input20', 'input21', 'area1'];
  var formElementTexts = [
    "Number positive or negative -- input type='number' -- Error on non-numeric characters",
    "Floating number range (integer excluded) -- between_num:x,y OR min_num:x|max_num:y",
    "Multiple Validations + Custom Regex of Date Code (YYWW)",
    "Email",
    "URL",
    "IP (IPV4)",
    "Credit Card",
    "Between(2,6) Characters",
    "Date ISO (yyyy-mm-dd)",
    "Date US LONG (mm/dd/yyyy)",
    "Time (hh:mm OR hh:mm:ss) -- NOT Required",
    "Required (select) -- validation with (blur) EVENT",
    "AlphaDashSpaces + Required + Minimum(5) Characters -- MUST USE: validation-error-to=' '",
    "Alphanumeric + Required -- NG-DISABLED",
    "Password",
    "Password Confirmation",
    "Different Password",
    "Alphanumeric + Exactly(3) + Required -- debounce(3sec)",
    "Date ISO (yyyy-mm-dd) -- minimum condition >= 2001-01-01",
    "Date US SHORT (mm/dd/yy) -- between the dates 12/01/99 and 12/31/15",
    "Choice IN this list (banana,orange,ice cream,sweet & sour)",
    "TextArea: Alphanumeric + Minimum(15) + Required",
    "Input22 - ngDisabled =>"
  ];
  var errorMessages = [
    "Must be a positive or negative number. Field is required.",
    "May only contain a positive or negative float value (integer excluded). Needs to be a numeric value, between -0.6 and 99.5. Field is required.",
    "Must have a length of exactly 4 characters. Field is required. Must be a positive integer. Must be following this format YYWW.",
    "Must be a valid email address. Field is required. Must be at least 6 characters.",
    "Must be a valid URL. Field is required.",
    "Must be a valid IP (IPV4). Field is required.",
    "Must be a valid credit card number. Field is required.",
    "Text must be between 2 and 6 characters in length. Field is required.",
    "Must be a valid date format (yyyy-mm-dd). Field is required.",
    "Must be a valid date format (mm/dd/yyyy) OR (mm-dd-yyyy). Field is required.",
    "Must be a valid time format (hh:mm) OR (hh:mm:ss).",
    "May only contain letters. Change language",
    "Must be at least 5 characters. May only contain letters, numbers, dashes and spaces. Field is required.",
    "",
    "May only contain letters. Must be at least 3 characters. Field is required.",
    "Confirmation field does not match specified field [Password]. Field is required.",
    "Field must be different from specified field [Password]. Field is required.",
    "May only contain letters and spaces. Must have a length of exactly 3 characters. Field is required.",
    "Needs to be a valid date format (yyyy-mm-dd), equal to, or higher than 2001-01-01. Field is required.",
    "Needs to be a valid date format (mm/dd/yy) OR (mm-dd-yy) between 11/28/99 and 12/31/15. Field is required.",
    "Must be a choice inside this list: (banana,orange,ice cream,sweet & sour). Field is required.",
    "May only contain letters, numbers, dashes and spaces. Must be at least 15 characters. Field is required."
  ];
  var validInputTexts = [
    "10",
    "2.5",
    "1212",
    "g@g.com",
    "http://ww.com",
    "192.10.10.10",
    "4538121220024545",
    "text",
    "2010-01-01",
    "02/02/2012",
    "10:10",
    "en",
    "qwerty",
    "",
    "pass",
    "pass",
    "diff",
    "abc",
    "2001-01-01",
    "01/01/12",
    "sweet & sour",
    "This is a great tool"
  ];
  var types = ['Directive', 'Service'];

  // variables used on 2Forms web page
  var formElement2FormsNames = ['input2', 'input3', 'input4', 'select1', 'area1'];
  var formElement2FormsSummaryNames = ['First Name', 'Last Name', 'input4', 'area1', 'select1'];
  var errorMessages2Forms = [
    'May only contain letters, numbers and dashes. Must be at least 2 characters. Field is required.',
    'May only contain letters, numbers and dashes. Must be at least 2 characters. Field is required.',
    'Change language',
    'May only contain letters, numbers, dashes and spaces. Must be at least 15 characters. Field is required.'
  ];
  var errorMessages2FormsExtra = 'May only contain letters, numbers and dashes. Must be at least 2 characters. Field is required.';
  var validInput2FormsTexts = [
    'John',
    'Doe',
    'abc',
    'en',
    'This is a great tool'
  ];
  var input3error = 'May only contain a positive or negative float value (integer excluded). Needs to be a numeric value, between -0.6 and 99.5. Field is required.';

  for(var k = 0, kln = types.length; k < kln; k++) {
    // because we are dealing with promises, we better use closures to pass certain variables
    (function(types, k) {
      describe('When clicking on top menu Angular-Validation >> ' + types[k], function () {
        it('Should navigate to Angular-Validation home page', function () {
          browser.get('http://localhost/Github/angular-validation');

          // Find the title element
          var titleElement = element(by.css('h1'));
          expect(titleElement.getText()).toEqual('Angular-Validation Directive|Service (ghiscoding)');
        });

        it('Should navigate to TestingForm' + types[k] + ' page', function () {
          browser.get('http://localhost/Github/angular-validation');

          var anchorLink = $('[name=btn_goto_' + types[k] +']');
          anchorLink.click();
          browser.waitForAngular();

          // Find the sub-title element
          var titleElement = element(by.css('h3'));
          expect(titleElement.getText()).toEqual(types[k]);
        });

        it('Should have multiple form elements with all english labels', function () {
          for (var i = 0, ln = formElementNames.length; i < ln; i++) {
            var elmLabel = $('label[for=' + formElementNames[i] + ']');
            expect(elmLabel.getText()).toEqual(formElementTexts[i]);
          }
        });

        it('Should click, blur on Remote input and error message should display', function () {
          var elmInput = $('[name=input1]');
          elmInput.click();
          element(by.css('body')).click();
          elmInput.sendKeys(protractor.Key.TAB);
          //$('[for=input1]').click();
          browser.waitForAngular();
          var elmError = $('.validation-input1');

          // Remote check will not process unless the input is field, so at first we will see the other validator errors only.
          expect(elmError.getText()).toEqual('May only contain letters. Must be at least 2 characters. Field is required.');
        });

        it('Should enter wrong data in Remote input and error message should display', function () {
          var elmInput = $('[name=input1]');
          elmInput.click();
          elmInput.sendKeys('ab');
          element(by.css('body')).click();
          elmInput.sendKeys(protractor.Key.TAB);
          //$('[for=input1]').click();
          browser.sleep(1100); // sleep because of our data sample having a delay of 1sec internally, we use 1.5sec on this side to be sure

          var elmError = $('.validation-input1');
          expect(elmError.getText()).toEqual('Returned error from promise.');
        });

        it('Should enter valid data in Remote input and error message should disappear', function () {
          var elmInput = $('[name=input1]');
          elmInput.clear().then(function() {
            elmInput.sendKeys('abc');
            element(by.css('body')).click();
            elmInput.sendKeys(protractor.Key.TAB);
            //$('[for=input1]').click();
            browser.sleep(1100); // sleep because of our data sample having a delay of 1sec internally, we use 1.5sec on this side to be sure

            var elmError = $('.validation-input1');
            expect(elmError.getText()).toEqual('');
          });
        });

        it('Should click, blur on each form elements and error message should display on each of them', function () {
          for (var i = 0, ln = formElementNames.length; i < ln; i++) {
            // some fields are not required or disabled so no error will show up, continue to next ones
            if (formElementNames[i] === 'input12' || formElementNames[i] === 'input14') {
              continue;
            }
            var elmInput = $('[name=' + formElementNames[i] + ']');
            elmInput.click();
            element(by.css('body')).click();
            elmInput.sendKeys(protractor.Key.TAB);
            //$('[for=' + formElementNames[i] + ']').click(); // click on label to blur away

            if (formElementNames[i] === 'select1') {
              element(by.cssContainingText('option', 'en')).click(); // click on good option first
              element(by.cssContainingText('option', '...')).click(); // then click on option[0], the one containing '...'
              element(by.css('body')).click();
              elmInput.sendKeys(protractor.Key.TAB);

              var elmError = $('.validation-select1');
              expect(elmError.getText()).toEqual(errorMessages[i]);
              continue;
            }

            var elmError = $('.validation-' + formElementNames[i]);
            expect(elmError.getText()).toEqual(errorMessages[i]);
          }
        });

        it('Should enter valid text and make error go away', function () {
          browser.sleep(2000);
          for (var i = 0, ln = formElementNames.length; i < ln; i++) {
            // some fields are not required or disabled so no error will show up, continue to next ones
            if (formElementNames[i] === 'input12' || formElementNames[i] === 'input14') {
              continue;
            }
            var elmInput = $('[name=' + formElementNames[i] + ']');
            elmInput.click();
            elmInput.sendKeys(validInputTexts[i]);
            elmInput.sendKeys(protractor.Key.TAB);
            element(by.css('body')).click();
            //$('[for=' + formElementNames[i] + ']').click(); // click on label to blur away

            if (formElementNames[i] === 'select1') {
              element(by.cssContainingText('option', validInputTexts[i])).click(); // click on good option
              elmInput.sendKeys(protractor.Key.TAB);
              element(by.css('body')).click();
            }

            var elmError = $('.validation-' + formElementNames[i]);
            expect(elmError.getText()).toEqual('');
          }
        });

        it('Should check that ngDisabled button is now enabled (after all input filled)', function() {
          var elmSubmit1 = $('[name=btn_ngDisabled]');
          //expect(elmSubmit1.isEnabled()).toBe(true);
        });

        it('Should make input3 error appear', function() {
          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            // make input3 invalid, remove text
            var elmInput3 = $('[name=input3]');
            clearInput(elmInput3);
            element(by.css('body')).click();
            elmInput3.sendKeys(protractor.Key.TAB);
            //$('[for=input3]').click(); // click on label to blur away

            // error should appear on input3
            var elmError3 = $('.validation-input3');
            expect(elmError3.getText()).toEqual(input3error);
          });
        });

        it('Should show input3 error in ValidationSummary', function () {
          var btnShowSummary = $('[name=btn_showValidation]');
          btnShowSummary.click();
          browser.waitForAngular();

          // showValidation checkbox should false at first but true after
          var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          expect(elmCheckboxShowSummary.isSelected()).toBeTruthy();

          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            var itemRows = element.all(by.binding('message'));
            var inputName;

            for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
              expect(itemRows.get(i).getText()).toEqual('input3: ' + input3error);
            }
          });
        });

        it('Should click on "Remove input3 validator" and error should go away from input & ValidationSummary', function() {
          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            var btnRemoveValidator2 = $('button[name=btn_RemoveValidator2]');
            btnRemoveValidator2.click();
            browser.waitForAngular();

            // error should be removed from input3
            var elmError2 = $('.validation-input3');
            expect(elmError2.getText()).toEqual('');

            // validation summary should become empty
            var itemRows = element.all(by.binding('message'));
            expect(itemRows.count()).toBe(0);
          });
        });

        it('Should enter any text on input3 and stay without errors', function () {
          // make input3 invalid, remove text
          var elmInput3 = $('[name=input3]');
          elmInput3.sendKeys('any text');

          // error should be removed from input3
          var elmError3 = $('.validation-input3');
          expect(elmError3.getText()).toEqual('');

          // validation summary should become empty
          var itemRows = element.all(by.binding('message'));
          expect(itemRows.count()).toBe(0);
        });

        it('Should check that ngDisabled button is now enabled (after input3 check)', function() {
          var elmSubmit1 = $('[name=btn_ngDisabled]');
          //expect(elmSubmit1.isEnabled()).toBe(true);
        });

        it('Should make input22 editable & should be without error until we focus later on it', function() {
          // click on the radio button OFF, that will make the input editable
          element(by.id('radioDisableInput22_off')).click();
          browser.waitForAngular();

          // error should not exist yet
          var elmError = element(by.css('.validation-input22'));
          expect(elmError.isPresent()).toBeFalsy();

          // Save button should become disable
          var elmSubmit1 = $('[name=btn_ngDisabled]');
          expect(elmSubmit1.isEnabled()).toBe(false);
        });


        it('Should focus and blur out of input22 & error should appear', function() {
          var elmInput = $('[name=input22]');
          elmInput.click();
          element(by.css('body')).click();
          elmInput.sendKeys(protractor.Key.TAB);
          //$('[for=input22]').click(); // click on label to blur away

          // error should appear
          var elmError = $('.validation-input22');
          expect(elmError.getText()).toEqual(errorMessages2FormsExtra);

          // Save button should still be disabled
          var elmSubmit1 = $('[name=btn_ngDisabled]');
          expect(elmSubmit1.isEnabled()).toBe(false);
        });

        it('Should show input22 error in ValidationSummary', function () {
          var btnShowSummary = $('[name=btn_showValidation]');
          btnShowSummary.click();
          browser.waitForAngular();

          // showValidation checkbox should false at first but true after
          var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          expect(elmCheckboxShowSummary.isSelected()).toBeTruthy();

          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            var itemRows = element.all(by.binding('message'));
            var inputName;

            for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
              expect(itemRows.get(i).getText()).toEqual('input22: May only contain letters, numbers and dashes. Must be at least 2 characters. Field is required.');
            }
          });
        });

        it('Should disable input22, error go away from input & validation summary', function() {
          // click on the radio button OFF, that will make the input editable
          element(by.id('radioDisableInput22_on')).click();
          browser.waitForAngular();

          // error should appear
          var elmError = $('.validation-input22');
          expect(elmError.getText()).toEqual('');

          // validation summary should become empty
          var itemRows = element.all(by.binding('message'));
          expect(itemRows.count()).toBe(0);
        });

        it('Should check that ngDisabled button is now enabled (after input22 check)', function() {
          var elmSubmit1 = $('[name=btn_ngDisabled]');
          //expect(elmSubmit1.isEnabled()).toBe(true);
        });

        it('Should reload english route, click on submit and display all error messages', function () {
          // scroll back to top if we want to be able to click on the English button
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            var elmBtnEnglish = $('button[name=btn_english]');
            elmBtnEnglish.click();
            browser.waitForAngular();

            var elmBtnNgSubmit = $('button[name=btn_ngSubmit]');
            elmBtnNgSubmit.click();
            browser.waitForAngular();

            for (var i = 0, ln = formElementNames.length; i < ln; i++) {
              // some fields are not required or disabled so no error will show up, continue to next ones
              if (formElementNames[i] === 'input12' || formElementNames[i] === 'input14') {
                continue;
              }
              var elmError = $('.validation-' + formElementNames[i]);
              expect(elmError.getText()).toEqual(errorMessages[i]);
            }
          });
        });

        it('Should click on ResetForm button and all errors should be gone', function() {
          var btnResetForm = $('[name=btn_resetForm]');
          btnResetForm.click();
          browser.waitForAngular();

          // loop through all form element and make sure there is no more errors
          for (var i = 0, ln = formElementNames.length; i < ln; i++) {
            // some fields are not required or disabled so no error will show up, continue to next ones
            if (formElementNames[i] === 'input12' || formElementNames[i] === 'input14') {
              continue;
            }
            var elmInput = $('[name=' + formElementNames[i] + ']');
            elmInput.click();
            elmInput.sendKeys(validInputTexts[i]);
            element(by.css('body')).click();
            elmInput.sendKeys(protractor.Key.TAB);

            if (formElementNames[i] === 'select1') {
              element(by.cssContainingText('option', validInputTexts[i])).click(); // click on good option
              element(by.css('body')).click();
              elmInput.sendKeys(protractor.Key.TAB);
            }

            var elmError = $('.validation-' + formElementNames[i]);
            expect(elmError.getText()).toEqual('');
          }
        });

        it('Should check that ngDisabled button is now enabled (after input22 check)', function() {
          var elmSubmit1 = $('[name=btn_ngDisabled]');
          //expect(elmSubmit1.isEnabled()).toBe(false);
        });

        it('Should reload english route & show ValidationSummary should contain all error messages', function () {
          var elmBtnEnglish = $('button[name=btn_english]');
          elmBtnEnglish.click();
          browser.waitForAngular();

          // showValidation checkbox should be false at first but true after we clicked on it
          var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          expect(elmCheckboxShowSummary.isSelected()).toBeFalsy();

          var btnShowSummary = $('[name=btn_showValidation]');
          btnShowSummary.click();
          browser.waitForAngular();

          elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          expect(elmCheckboxShowSummary.isSelected()).toBeTruthy();

          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            var itemRows = element.all(by.binding('message'));
            var inputName;

            for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
              // since field after input13 is part of errorMessages and is empty string, we need to skip that one
              if (formElementNames[i] === 'input13') {
                j++;
              }
              expect(itemRows.get(i).getText()).toEqual(formElementSummaryNames[i] + ': ' + errorMessages[j++]);
            }
          });
        });

      });         // Directive()
    })(types, k); // closure
  }               // for()

  describe('When clicking on top menu Angular-Validation >> 2 Forms', function () {
    it('Should navigate to Angular-Validation home page', function () {
      browser.get('http://localhost/Github/angular-validation');

      // Find the title element
      var titleElement = element(by.css('h1'));
      expect(titleElement.getText()).toEqual('Angular-Validation Directive|Service (ghiscoding)');
    });

    it('Should navigate to TestingForm 2Forms page', function () {
      browser.get('http://localhost/Github/angular-validation');

      var anchorLink = $('[name=btn_goto_2forms]');
      anchorLink.click();
      browser.waitForAngular();

      // Find the sub-title element
      var titleElement = element(by.css('h3'));
      expect(titleElement.getText()).toEqual('Directive - 2 Forms');
    });

    it('Should show ValidationSummary and contain all error messages', function () {
      // showValidation checkbox should false at first but true after
      var elmCheckboxShowSummary = element(by.model('vm.displayValidationSummary'));
      expect(elmCheckboxShowSummary.isSelected()).toBeFalsy();

      var btnShowSummary = $('[name=btn_showValidation]');
      btnShowSummary.click();
      browser.waitForAngular();

      elmCheckboxShowSummary = element(by.model('vm.displayValidationSummary'));
      expect(elmCheckboxShowSummary.isSelected()).toBeTruthy();

      // scroll back to top
      browser.executeScript('window.scrollTo(0,0);').then(function () {
        var itemRows = element.all(by.binding('message'));
        var inputName;

        for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
          // since field after input4 is part of errorMessages and is empty string, we need to skip that one
          if (formElement2FormsNames[i] === 'input4') {
            j++;
          }
          expect(itemRows.get(i).getText()).toEqual(formElement2FormsSummaryNames[i] + ': ' + errorMessages2Forms[j++]);
        }
      });
    });

    it('Should enter valid text and make error go away', function () {
      for (var i = 0, ln = formElement2FormsNames.length; i < ln; i++) {
        // since field after input4 is part of errorMessages and is empty string, we need to skip that one
        if (formElement2FormsNames[i] === 'input4') {
          continue;
        }

        var elmInput = $('[name=' + formElement2FormsNames[i] + ']');
        elmInput.click();
        elmInput.sendKeys(validInput2FormsTexts[i]);

        if (formElement2FormsNames[i] === 'select1') {
          element(by.cssContainingText('option', validInput2FormsTexts[i])).click(); // click on good option
          element(by.css('body')).click();
          elmInput.sendKeys(protractor.Key.TAB);
        }

        var elmError = $('.validation-' + formElement2FormsNames[i]);
        expect(elmError.getText()).toEqual('');
      }
    });

    it('Should check that both submit buttons are now enabled', function() {
      var elmSubmit1 = $('[name=save_btn1]');
      expect(elmSubmit1.isEnabled()).toBe(true);

      var elmSubmit2 = $('[name=save_btn2]');
      expect(elmSubmit2.isEnabled()).toBe(true);
    });

    it('Should make input4 editable & error should appear', function() {
      // click on the radio button OFF, that will make the input editable
      element(by.id('radioDisableInput4_off')).click();

      // error should appear
      var elmError = $('.validation-input4');
      expect(elmError.getText()).toEqual(errorMessages2FormsExtra);

      // Save button should become disable
      var elmSubmit1 = $('[name=save_btn1]');
      expect(elmSubmit1.isEnabled()).toBe(false);
    });

    it('Should show input4 error in ValidationSummary', function () {
      var btnShowSummary = $('[name=btn_showValidation]');
      btnShowSummary.click();
      browser.waitForAngular();

      // showValidation checkbox should false at first but true after
      var elmCheckboxShowSummary = element(by.model('vm.displayValidationSummary'));
      expect(elmCheckboxShowSummary.isSelected()).toBeTruthy();

      // scroll back to top
      browser.executeScript('window.scrollTo(0,0);').then(function () {
        var itemRows = element.all(by.binding('message'));
        var inputName;

        for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
          expect(itemRows.get(i).getText()).toEqual('input4: Field is required.');
        }
      });
    });

    it('Should disable input4, error go away from input & validation summary', function() {
      // click on the radio button OFF, that will make the input editable
      element(by.id('radioDisableInput4_on')).click();

      // error should appear
      var elmError = $('.validation-input4');
      expect(elmError.getText()).toEqual('');

      // validation summary should become empty
      var itemRows = element.all(by.binding('message'));
      expect(itemRows.count()).toBe(0);
    });

    it('Should check that both submit buttons are now enabled', function() {
      var elmSubmit1 = $('[name=save_btn1]');
      expect(elmSubmit1.isEnabled()).toBe(true);

      var elmSubmit2 = $('[name=save_btn2]');
      expect(elmSubmit2.isEnabled()).toBe(true);
    });

    it('Should reload english route, and enter invalid text on inputs', function() {
      var elmBtnEnglish = $('button[name=btn_english]');
      elmBtnEnglish.click();
      browser.waitForAngular();

      // just enter letter "a" on first 2 inputs to make them invalid
      var ln = 2;
      for (var i = 0; i < ln; i++) {
        var elmInput = $('[name=' + formElement2FormsNames[i] + ']');
        elmInput.click();
        elmInput.sendKeys("a");
        element(by.css('body')).click();
        elmInput.sendKeys(protractor.Key.TAB);

        // both inputs should have the same error message
        var elmError = $('.validation-' + formElement2FormsNames[i]);
        expect(elmError.getText()).toEqual('Must be at least 2 characters.');
      }
    });

    it('Should check that first submit button is disabled', function() {
      var elmSubmit1 = $('[name=save_btn1]');
      expect(elmSubmit1.isEnabled()).toBe(false);
    });

    it('Should click on ResetForm button, then error should be gone and input value now being empty', function() {
      var btnResetForm = $('[name=btn_resetForm]');
      btnResetForm.click();
      browser.waitForAngular();

      // just loop on first 2 inputs and make sure they are now empty input values and empty error message
      var ln = 2;
      for (var i = 0; i < ln; i++) {
        var elmInput = $('[name=' + formElement2FormsNames[i] + ']');
        expect(elmInput.getAttribute('value')).toEqual('');

        var elmError = $('.validation-' + formElement2FormsNames[i]);
        expect(elmError.getText()).toEqual('');
      }
    });

    it('Should check that first submit button is now enabled', function() {
      var elmSubmit1 = $('[name=save_btn1]');
      expect(elmSubmit1.isEnabled()).toBe(true);
    });

  }); // describe 2forms
});   // describe Angular-Validation tests


/** From a given input name, clear the input
 * @param string input name
 */
function clearInput(elem) {
  elem.getAttribute('value').then(function (text) {
    var len = text.length
    var backspaceSeries = Array(len+1).join(protractor.Key.BACK_SPACE);
    elem.sendKeys(backspaceSeries);
  })
}