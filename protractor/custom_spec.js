describe('Angular-Validation Custom Javascript Validation Tests:', function () {
  // global variables
  var formElementNames = ['input1', 'input2', 'iban1', 'input3', 'input4', 'iban2'];
  var errorMessages = [
    'May only contain letters. Must be at least 2 characters. Field is required.',
    'May only contain letters. Must be at least 2 characters. Field is required.',
    'Field is required.',
    'May only contain letters. Must be at least 2 characters. Field is required.',
    'May only contain letters. Must be at least 2 characters. Field is required.',
    'Field is required.'
  ];
  var errorTooShortOrInvalid = [
    'Must be at least 2 characters. Alternate error message.',
    'Must be at least 2 characters. Returned error from custom function.',
    'Invalid IBAN.',
    'Must be at least 2 characters. Alternate error message.',
    'Must be at least 2 characters. Returned error from custom function.',
    'Invalid IBAN.',
  ];
  var oneChar = ['a', 'd', 'iban', 'a', 'd', 'iban'];
  var validInputTexts = ['abc', 'def', 'BE68539007547034', 'abc', 'def', 'BE68539007547034'];

  describe('When choosing `more-examples` custom javascript', function () {
    it('Should navigate to home page', function () {
      browser.get('http://localhost/Github/angular-validation/more-examples/customValidation/');

      // Find the title element
      var titleElement = element(by.css('h2'));
      expect(titleElement.getText()).toEqual('Example of Angular-Validation with Custom Javascript function');
    });

    it('Should have multiple errors in Directive & Service validation summary', function () {
      var itemRows = element.all(by.binding('message'));
      var inputName;

      for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
        expect(itemRows.get(i).getText()).toEqual(errorMessages[i]);
      }
    });

    it('Should check that both submit buttons are disabled', function() {
      var elmSubmit1 = $('[name=btn_ngDisabled1]');
      expect(elmSubmit1.isEnabled()).toBe(false);

      var elmSubmit2 = $('[name=btn_ngDisabled2]');
      expect(elmSubmit2.isEnabled()).toBe(false);
    });

    it('Should click, blur on each form elements and error message should display on each of them', function () {
      for (var i = 0, ln = formElementNames.length; i < ln; i++) {
        var elmInput = $('[name=' + formElementNames[i] + ']');
        elmInput.click();
        element(by.css('body')).click();
        elmInput.sendKeys(protractor.Key.TAB);

        var elmError = $('.validation-' + formElementNames[i]);
        expect(elmError.getText()).toEqual(errorMessages[i]);
      }
    });

    it('Should enter 1 character in all inputs and display minChar error message', function() {
      for (var i = 0, ln = formElementNames.length; i < ln; i++) {
        var elmInput = $('[name=' + formElementNames[i] + ']');
        elmInput.click();
        elmInput.sendKeys('a');

        var elmError = $('.validation-' + formElementNames[i]);
        expect(elmError.getText()).toEqual(errorTooShortOrInvalid[i]);
      }
    });

    it('Should enter valid text and make error go away', function () {
      for (var i = 0, ln = formElementNames.length; i < ln; i++) {
        var elmInput = $('[name=' + formElementNames[i] + ']');
        elmInput.click();
        clearInput(elmInput);
        elmInput.sendKeys(validInputTexts[i]);
        element(by.css('body')).click();
        elmInput.sendKeys(protractor.Key.TAB);

        var elmError = $('.validation-' + formElementNames[i]);
        expect(elmError.getText()).toEqual('');
      }
    });

    it('Should have both validation summary empty', function() {
      var itemRows = element.all(by.binding('message'));
      expect(itemRows.count()).toBe(0);
    });

    it('Should check that both submit buttons are now enabled', function() {
      var elmSubmit1 = $('[name=btn_ngDisabled1]');
      expect(elmSubmit1.isEnabled()).toBe(true);

      var elmSubmit2 = $('[name=btn_ngDisabled2]');
      expect(elmSubmit2.isEnabled()).toBe(true);
    });

    it('Should navigate to home page', function () {
      browser.get('http://localhost/Github/angular-validation/more-examples/customValidation/');

      // Find the title element
      var titleElement = element(by.css('h2'));
      expect(titleElement.getText()).toEqual('Example of Angular-Validation with Custom Javascript function');
    });

    it('Should click on both ngSubmit buttons', function() {
      var btnNgSubmit1 = $('[name=btn_ngSubmit1]');
      btnNgSubmit1.click();

      var btnNgSubmit2 = $('[name=btn_ngSubmit2]');
      btnNgSubmit2.click();
    });

    it('Should show error message on each inputs', function () {
      for (var i = 0, ln = formElementNames.length; i < ln; i++) {
        var elmInput = $('[name=' + formElementNames[i] + ']');
        elmInput.click();
        element(by.css('body')).click();
        elmInput.sendKeys(protractor.Key.TAB);

        var elmError = $('.validation-' + formElementNames[i]);
        expect(elmError.getText()).toEqual(errorMessages[i]);
      }
    });

  });
});

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