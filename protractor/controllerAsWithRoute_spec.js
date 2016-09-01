describe('Angular-Validation ControllerAs with Route Tests:', function () {
  // global variables

  describe('When choosing `more-examples` ControllerAs with Route', function () {
    it('Should navigate to ControllerAs with Route home page', function () {
      browser.get('http://localhost/github/angular-validation/more-examples/controllerAsWithRoute/index.html');

      // Find the title element
      var titleElement = element(by.css('h2'));

      // Assert that the text element has the expected value.
      // Protractor patches 'expect' to understand promises.
      expect(titleElement.getText()).toEqual('Angular-Validation with Routes Getting an error typing a char in Field1.');
    });

    it('Should show 1 error on Top Form Valdation Summary', function () {
      var firstError = element.all(by.repeater('item in vmA.test.$validationSummary')).get(0);
      expect(firstError.getText()).toEqual('f1: Field is required.');
    });

    it('Should show 1 error on bottom Form Valdation Summary in ngView (First Route)', function () {
      var firstError = element.all(by.repeater('item in vm.firstForm.$validationSummary')).get(0);
      expect(firstError.getText()).toEqual('firstField: Field is required.');
    });

    it('Should enter valid data and show 0 error on Top Form Valdation Summary', function () {
      var elmInput = $('[name=f1]');
      elmInput.sendKeys('abc');
      element(by.css('body')).click();
      elmInput.sendKeys(protractor.Key.TAB);

      // validation summary should become empty
      var itemRows = element.all(by.repeater('item in vmA.test.$validationSummary'));
      expect(itemRows.count()).toBe(0);
    });

    it('Should enter valid data and show 0 error on bottom Form Valdation Summary in ngView (First Route)', function () {
      var elmInput = $('[name=firstField]');
      elmInput.sendKeys('abc');
      element(by.css('body')).click();
      elmInput.sendKeys(protractor.Key.TAB);

      // validation summary should become empty
      var itemRows = element.all(by.repeater('item in vm.firstForm.$validationSummary'));
      expect(itemRows.count()).toBe(0);
    });

    it('Should navigate to Route Second', function () {
      var anchorLink = $('[name=second_route]');
      anchorLink.click();
      browser.waitForAngular();
    });

    it('Should show 1 error on bottom Form Valdation Summary in ngView (First Route)', function () {
      var firstError = element.all(by.repeater('item in vm.secondForm.$validationSummary')).get(0);
      expect(firstError.getText()).toEqual('secondField: Field is required.');
    });

    it('Should still show 0 error on Top Form', function () {
      // validation summary should become empty
      var itemRows = element.all(by.repeater('item in vmA.test.$validationSummary'));
      expect(itemRows.count()).toBe(0);
    });

    it('Should enter valid data and show 0 error on bottom Form Valdation Summary in ngView (First Route)', function () {
      var elmInput = $('[name=secondField]');
      elmInput.sendKeys('abc');
      element(by.css('body')).click();
      elmInput.sendKeys(protractor.Key.TAB);

      // validation summary should become empty
      var itemRows = element.all(by.repeater('item in vm.secondForm.$validationSummary'));
      expect(itemRows.count()).toBe(0);
    });
  });
});