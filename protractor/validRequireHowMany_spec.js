describe('Angular-Validation ValidRequireHowMany Validation Tests:', function () {
  // global variables
  var formElementNames = ['input1', 'input2'];
  var errorMessageWithRequired = 'Must be a valid IP (IPV4). Must be a valid IP (IPV6). Field is required.';
  var errorMessageWithoutRequired = 'Must be a valid IP (IPV4). Must be a valid IP (IPV6).';
  var invalidInputTexts = ['192.168.10.10.', '1762:0:0:0:0:B03:1'];
  var validInputTexts = ['192.168.10.10', '2002:4559:1FE2::4559:1FE2'];
  var title = 'Angular-Validation with ValidRequireHowMany';
  var url = 'http://localhost/Github/angular-validation/more-examples/validRequireHowMany/';

  describe('When choosing `more-examples` validRequireHowMany', function () {
    it('Should navigate to home page', function () {
      browser.get(url);

      // Find the title element
      var titleElement = element(by.css('h2'));
      expect(titleElement.getText()).toEqual(title);
    });

    it('Should have multiple errors in Directive & Service validation summary', function () {
      var itemRows = element.all(by.binding('message'));
      var inputName;

      for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
        expect(itemRows.get(i).getText()).toEqual(errorMessageWithRequired);
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
        expect(elmError.getText()).toEqual(errorMessageWithRequired);
      }
    });

    it('Should enter invalid IP and display error message without required', function() {
      for (var i = 0, ln = formElementNames.length; i < ln; i++) {
        var elmInput = $('[name=' + formElementNames[i] + ']');
        elmInput.click();
        clearInput(elmInput);
        elmInput.sendKeys(invalidInputTexts[i]);
        element(by.css('body')).click();
        elmInput.sendKeys(protractor.Key.TAB);

        var elmError = $('.validation-' + formElementNames[i]);
        expect(elmError.getText()).toEqual(errorMessageWithoutRequired);
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
      browser.get(url);

      // Find the title element
      var titleElement = element(by.css('h2'));
      expect(titleElement.getText()).toEqual(title);
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
        expect(elmError.getText()).toEqual(errorMessageWithRequired);
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