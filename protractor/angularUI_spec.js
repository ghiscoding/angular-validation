describe('Angular-Validation with AngularUI Tests:', function () {
  // global variables
  var validDate = "01/10/2015";
  var invalidOverDate = "03/10/2015";
  var invalidTypoDate = "03/10/201";
  var invalidDateMsg = "dateOfChange: Needs to be a valid date format (dd-mm-yyyy) OR (dd/mm/yyyy) between 02/10/2005 and 02/10/2015.";

  describe('When choosing `more-examples` AngularUI', function () {
    it('Should navigate to home page', function () {
      browser.get('http://localhost/Github/angular-validation/more-examples/angular-ui-calendar/');

      // Find the title element
      var titleElement = element(by.css('h2'));

      // Assert that the text element has the expected value.
      // Protractor patches 'expect' to understand promises.
      expect(titleElement.getText()).toEqual('Example of Angular-Validation Date validation error after select from ui datepicker.');
    });

    it('Should enter valid date expect no errors on input and validation summary', function () {
      var elmInput = $('[name=dateOfChange]');
      elmInput.sendKeys(validDate);
      element(by.css('body')).click();
      elmInput.sendKeys(protractor.Key.TAB);

      // validation summary should become empty
      var itemRows = element.all(by.binding('message'));
      expect(itemRows.count()).toBe(0);
    });

    it('Should enter outside of range date and show dateOfChange error on input and ValidationSummary', function () {
      var elmInput = $('[name=dateOfChange]');
      elmInput.sendKeys(invalidOverDate);
      element(by.css('body')).click();
      elmInput.sendKeys(protractor.Key.TAB);

      var itemRows = element.all(by.binding('message'));
      var inputName;

      for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
        expect(itemRows.get(i).getText()).toEqual(invalidDateMsg);
      }
    });

    it('Should enter wrong date format and show dateOfChange error on input and ValidationSummary', function () {
      var elmInput = $('[name=dateOfChange]');
      elmInput.sendKeys(invalidTypoDate);
      element(by.css('body')).click();
      elmInput.sendKeys(protractor.Key.TAB);

      var itemRows = element.all(by.binding('message'));
      var inputName;

      for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
        expect(itemRows.get(i).getText()).toEqual(invalidDateMsg);
      }
    });
  });
});