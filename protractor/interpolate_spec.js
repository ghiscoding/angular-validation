describe('Angular-Validation Interpolate Validation Tests:', function () {
  // global variables

  describe('When choosing `more-examples` Interpolate Validation', function () {
    it('Should navigate to Interpolate Validation home page', function () {
      browser.get('http://localhost/github/angular-validation/more-examples/interpolateValidation/index.html');

      // Find the title element
      var titleElement = element(by.css('h2'));

      // Assert that the text element has the expected value.
      // Protractor patches 'expect' to understand promises.
      expect(titleElement.getText()).toEqual('Example of Angular-Validation interpolation to validation attribute.');
    });

    it('Should show 1 error of first field on Validation Summary', function () {
      var firstError = element.all(by.repeater('item in vm.test.$validationSummary')).get(0);
      expect(firstError.getText()).toEqual('f1: Field is required.');
    });

    it('Should click on toggle checkbox to inverse validation', function () {
      var elmToggle = $('[name=toggle]');
      elmToggle.click();
      browser.waitForAngular();
    });

    it('Should show 1 error of second field on Validation Summary', function () {
      var firstError = element.all(by.repeater('item in vm.test.$validationSummary')).get(0);
      expect(firstError.getText()).toEqual('if1: Field is required.');
    });

    it('Should enter valid data and show 0 error on bottom Form in ngView (First Route)', function () {
      var elmInput = $('[name=if1]');
      elmInput.sendKeys('abc');
      element(by.css('body')).click();
      elmInput.sendKeys(protractor.Key.TAB);

      // validation summary should become empty
      var itemRows = element.all(by.repeater('item in vm.test.$validationSummary'));
      expect(itemRows.count()).toBe(0);
    });

    it('Should empty the field "if1" and show back the error on field & summary', function() {
      var elmInput = $('[name=if1]');
      clearInput(elmInput);

      // validation summary should become empty
      var firstError = element.all(by.repeater('item in vm.test.$validationSummary')).get(0);
      expect(firstError.getText()).toEqual('if1: Field is required.');
    });

    it('Should click on toggle checkbox to inverse validation', function () {
      var elmToggle = $('[name=toggle]');
      elmToggle.click();
      browser.waitForAngular();
    });

    it('Should empty the field "f1" and show back the error on field & summary', function() {
      var elmInput = $('[name=f1]');
      clearInput(elmInput);

      // validation summary should become empty
      var firstError = element.all(by.repeater('item in vm.test.$validationSummary')).get(0);
      expect(firstError.getText()).toEqual('f1: Field is required.');
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