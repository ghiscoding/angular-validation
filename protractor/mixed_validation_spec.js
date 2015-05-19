describe('Angular-Validation Tests:', function () {
  // global variables
  var formElementNames = ['input2', 'input3', 'input4', 'input5', 'input6', 'input7', 'input8', 'input9', 'input10', 'input11', 'input12', 'select1', 'input13', 'input14', 'input15', 'input16', 'input17', 'input18', 'input19', 'area1'];
  var formElementSummaryNames = ['input2', 'input3', 'input4', 'Email', 'input6', 'input7', 'Credit Card', 'input9', 'input10', 'input11', 'select1', 'input13', 'input15', 'input16', 'input17', 'input18', 'input19', 'area1'];
  var formElementTexts = [
    'Number positive or negative -- input type="number" -- Error on non-numeric characters',
    'Floating number range (integer excluded) -- between_num:x,y OR min_num:x|max_num:y',
    'Multiple Validations + Custom Regex of Date Code (YYWW)',
    'Email',
    'URL',
    'IP (IPV4)',
    'Credit Card',
    'Between(2,6) Characters',
    'Date ISO (yyyy-mm-dd)',
    'Date US LONG (mm/dd/yyyy)',
    'Time (hh:mm OR hh:mm:ss) -- NOT Required',
    'Required (select) -- validation with (blur) EVENT',
    'AlphaDashSpaces + Required + Minimum(5) Characters -- MUST USE: validation-error-to=" "',
    'Alphanumeric + Required -- NG-DISABLED',
    'Password',
    'Password Confirmation',
    'Alphanumeric + Exactly(3) + Required -- debounce(3sec)',
    'Date ISO (yyyy-mm-dd) -- minimum condition >= 2001-01-01',
    'Date US SHORT (mm/dd/yy) -- between the dates 12/01/99 and 12/31/15',
    'TextArea: Alphanumeric + Minimum(15) + Required'
  ];
  var errorMessages = [
    'Must be a positive or negative number. Field is required.',
    'May only contain a positive or negative float value (integer excluded). Needs to be a numeric value, between -0.6 and 99.5. Field is required.',
    'Must have a length of exactly 4 characters. Must be following this format: YYWW. Field is required. Must be a positive integer.',
    'Must be a valid email address. Field is required. Must be at least 6 characters.',
    'Must be a valid URL. Field is required.',
    'Must be a valid IP (IPV4). Field is required.',
    'Must be a valid credit card number. Field is required.',
    'Text must be between 2 and 6 characters in length. Field is required.',
    'Must be a valid date format (yyyy-mm-dd). Field is required.',
    'Must be a valid date format (mm/dd/yyyy) OR (mm-dd-yyyy). Field is required.',
    'Must be a valid time format (hh:mm) OR (hh:mm:ss).',
    'May only contain letters. Change language',
    'Must be at least 5 characters. May only contain letters, numbers, dashes and spaces. Field is required.',
    '',
    'May only contain letters. Must be at least 3 characters. Field is required.',
    'Confirmation field does not match specified field "input15". Field is required.',
    'May only contain letters and spaces. Must have a length of exactly 3 characters. Field is required.',
    'Needs to be a valid date format (yyyy-mm-dd), equal to, or higher than 2001-01-01. Field is required.',
    'Needs to be a valid date format (mm/dd/yy) OR (mm-dd-yy) between 11/28/99 and 12/31/15. Field is required.',
    'May only contain letters, numbers, dashes and spaces. Must be at least 15 characters. Field is required.'
  ];
  var validInputTexts = [
    '10',
    '2.5',
    '1212',
    'g@g.com',
    'http://ww.com',
    '192.10.10.10',
    '4538121220024545',
    'text',
    '2010-01-01',
    '02/02/2012',
    '10:10',
    'en',
    'qwerty',
    '',
    'pass',
    'pass',
    'abc',
    '2001-01-01',
    '01/01/12',
    'This is a great tool'
  ];
  var types = ['Directive', 'Service'];

  for(var k = 0, kln = types.length; k < kln; k++) {
    // because we are dealing with promises, we better use closures to pass certain variables
    (function(types, k) {
      describe('When clicking on top menu Angular-Validation >> ' + types[k], function () {
        it('Should navigate to Angular-Validation home page', function () {
          browser.get('http://localhost/Github/angular-validation');

          // Find the title element
          var titleElement = element(by.css('h1'));

          // Assert that the text element has the expected value.
          // Protractor patches 'expect' to understand promises.
          expect(titleElement.getText()).toEqual('Angular-Validation Directive|Service (ghiscoding)');
        });

        it('Should navigate to TestingForm' + types[k] + ' page', function () {
          browser.get('http://localhost/Github/angular-validation');

          var anchorLink = $('[name=btn_goto_' + types[k] +']');
          anchorLink.click();
          browser.waitForAngular();

          // Find the sub-title element
          var titleElement = element(by.css('h3'));

          // Assert that the text element has the expected value.
          // Protractor patches 'expect' to understand promises.
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
          elmInput.sendKeys(protractor.Key.TAB);
          var elmError = $('.validation-input1');

          // Remote check will not process unless the input is field, so at first we will see the other validator errors only.
          expect(elmError.getText()).toEqual('May only contain letters. Must be at least 2 characters. Field is required.');
        });

        it('Should enter wrong data in Remote input and error message should display', function () {
          var elmInput = $('[name=input1]');
          elmInput.click();
          elmInput.sendKeys('ab');
          elmInput.sendKeys(protractor.Key.TAB);
          browser.sleep(1500); // sleep because of our data sample having a delay of 1sec internally, we use 1.5sec on this side to be sure

          var elmError = $('.validation-input1');
          expect(elmError.getText()).toEqual('Returned error from promise.');
        });

        it('Should enter valid data in Remote input and error message should disappear', function () {
          var elmInput = $('[name=input1]');
          elmInput.clear().then(function() {
            elmInput.sendKeys('abc');
            elmInput.sendKeys(protractor.Key.TAB);
            browser.sleep(1500); // sleep because of our data sample having a delay of 1sec internally, we use 1.5sec on this side to be sure

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
            elmInput.sendKeys(protractor.Key.TAB);

            if (formElementNames[i] === 'select1') {
              element(by.cssContainingText('option', 'en')).click(); // click on good option first
              element(by.cssContainingText('option', '...')).click(); // then click on option[0], the one containing '...'
              elmInput.sendKeys(protractor.Key.TAB);
              //browser.sleep(5000); // sleep 5 seconds

              var elmError = $('.validation-select1');
              expect(elmError.getText()).toEqual(errorMessages[i]);
              continue;
            }

            var elmError = $('.validation-' + formElementNames[i]);
            expect(elmError.getText()).toEqual(errorMessages[i]);
          }
        });

        it('Should enter valid text and make error go away', function () {
          for (var i = 0, ln = formElementNames.length; i < ln; i++) {
            // some fields are not required or disabled so no error will show up, continue to next ones
            if (formElementNames[i] === 'input12' || formElementNames[i] === 'input14') {
              continue;
            }
            var elmInput = $('[name=' + formElementNames[i] + ']');
            elmInput.click();
            elmInput.sendKeys(validInputTexts[i]);

            if (formElementNames[i] === 'select1') {
              element(by.cssContainingText('option', validInputTexts[i])).click(); // click on good option
              elmInput.sendKeys(protractor.Key.TAB);
            }

            var elmError = $('.validation-' + formElementNames[i]);
            expect(elmError.getText()).toEqual('');
          }
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

        it('Should show ValidationSummary and contain all error messages', function () {
          var elmBtnEnglish = $('button[name=btn_english]');
          elmBtnEnglish.click();
          browser.waitForAngular();

          // showValidation checkbox should false at first but true after
          var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          expect(elmCheckboxShowSummary.isSelected()).toBeFalsy();

          var btnShowSummary = $('button[name=btn_showValidation]');
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
});