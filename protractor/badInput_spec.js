describe('Angular-Validation badInput Tests:', function () {
  // global variables
  var input2error = "Must be a positive or negative number. Field is required.";
  var input2invalidChar = "Invalid keyboard entry on a field of type 'number'.";
  var types = ['Directive', 'Service'];

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

        it('Should display invalid character error message when user type invalid characters in an input[number]', function() {
          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            // make input3 invalid, remove text
            var elmInput2 = $('[name=input2]');
            elmInput2.click();
            elmInput2.sendKeys('2.5..');

            // error should appear on input2
            var elmError2 = $('.validation-input2');
            expect(elmError2.getText()).toEqual(input2invalidChar);
          });
        });

        it('Should display same invalid character error message even after a Tab', function() {
          // make input3 invalid, remove text
          var elmInput2 = $('[name=input2]');
          elmInput2.sendKeys(protractor.Key.TAB);

          // error should appear on input2
          var elmError2 = $('.validation-input2');
          expect(elmError2.getText()).toEqual(input2invalidChar);
        });

        it('Should show ValidationSummary after clicking on show checkbox', function() {
          // showValidation checkbox should be false at first but true after
          var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          expect(elmCheckboxShowSummary.isSelected()).toBeFalsy();

          // go to the bottom of the form and click on the button showValidation
          browser.executeScript('window.scrollTo(0,1500);').then(function () {
            var btnShowSummary = $('[name=btn_showValidation]');
            btnShowSummary.click();
            browser.waitForAngular();

            // scroll back to top
            var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          });
        });

        it('Should show same invalid character in ValidationSummary', function() {
          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            var itemRows = element.all(by.binding('message'));
            var inputName;

            for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
              expect(itemRows.get(i).getText()).toEqual('input2: ' + input2invalidChar);
            }
          });
        });

        it('Should hide ValidationSummary after clicking on checkbox', function() {
          var btnShowSummary = $('[name=chkbox_validationSummary]');
          btnShowSummary.click();
          browser.waitForAngular();

          // showValidation checkbox should be false at first but true after
          var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          //expect(elmCheckboxShowSummary.isSelected()).toBeFalsy();
        });

        it('Should display default input2 error message after clearing the input', function() {
          // make input3 invalid, remove text
          var elmInput2 = $('[name=input2]');
          elmInput2.click();
          clearInput(elmInput2, 5);
          elmInput2.sendKeys(protractor.Key.TAB);

          // error should appear on input2
          var elmError2 = $('.validation-input2');
          expect(elmError2.getText()).toEqual(input2error);
        });

        it('Should show ValidationSummary after clicking on show checkbox', function() {
          var btnShowSummary = $('[name=chkbox_validationSummary]');
          btnShowSummary.click();
          browser.waitForAngular();

          // showValidation checkbox should be false at first but true after
          var elmCheckboxShowSummary = element(by.model('displayValidationSummary'));
          expect(elmCheckboxShowSummary.isSelected()).toBeTruthy();
        });

        it('Should display default input2 error message in ValidationSummary', function() {
          // scroll back to top
          browser.executeScript('window.scrollTo(0,0);').then(function () {
            var itemRows = element.all(by.binding('message'));
            var inputName;

            for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
              expect(itemRows.get(i).getText()).toEqual('input2: ' + input2error);
            }
          });
        });

      });         // Directive()
    })(types, k); // closure
  }               // for()

});   // describe Angular-Validation tests


/** From a given input name, clear the input
 * @param string input name
 */
function clearInput(elem, ln) {
  elem.getAttribute('value').then(function (text) {
    var len = (!!ln) ? ln : text.length
    var backspaceSeries = Array(len+1).join(protractor.Key.BACK_SPACE);
    elem.sendKeys(backspaceSeries);
  })
}