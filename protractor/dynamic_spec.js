describe('Angular-Validation Dynamic (isolated scope) Tests:', function () {
  // global variables

  describe('When choosing `more-examples` Dynamic Form Input', function () {
    it('Should navigate to Dynamic Form Input home page', function () {
      browser.get('http://localhost/github/angular-validation/more-examples/dynamic-form/index.html');
      browser.waitForAngular();

      // Find the title element
      var titleElement = element(by.css('h3'));

      // Assert that the text element has the expected value.
      // Protractor patches 'expect' to understand promises.
      expect(titleElement.getText()).toEqual('Form Validation (with dynamic form and fields)');
    });

    it('Should click on Validate Submit button and expect 2 invalid Forms', function () {
      browser.waitForAngular();
      browser.sleep(5000);
      var validateBtn = $('[name=validateForms]');
      validateBtn.click();
      browser.waitForAngular();

      var elmForm1isValid = element(by.binding('Form1.isValid'));
      expect(elmForm1isValid.getText()).toEqual('Form1 isValid: false');

      var elmForm2isValid = element(by.binding('Form2.isValid'));
      expect(elmForm2isValid.getText()).toEqual('Form2 isValid: false');
    });

    it('Should enter valid data in Form1 and expect valid Form1 but invalid Form2', function () {
      var elmFirstName = $('[name=firstName]');
      elmFirstName.sendKeys('abc');
      element(by.css('body')).click();
      elmFirstName.sendKeys(protractor.Key.TAB);

      var elmLastName = $('[name=lastName]');
      elmLastName.sendKeys('def');
      element(by.css('body')).click();
      elmLastName.sendKeys(protractor.Key.TAB);

      var validateBtn = $('[name=validateForms]');
      validateBtn.click();
      browser.waitForAngular();

      var elmForm1isValid = element(by.binding('Form1.isValid'));
      expect(elmForm1isValid.getText()).toEqual('Form1 isValid: true');

      var elmForm2isValid = element(by.binding('Form2.isValid'));
      expect(elmForm2isValid.getText()).toEqual('Form2 isValid: false');
    });

    it('Should click on second Tab and show second Form', function () {
      var tab2 = element(by.id('Item2'));
      tab2.click();
      browser.waitForAngular();
    });

    it('Should enter valid data in Form2 and expect both Forms to be valid', function () {
      var elmEmail = $('[name=email]');
      elmEmail.sendKeys('abc');
      element(by.css('body')).click();
      elmEmail.sendKeys(protractor.Key.TAB);

      var elmPhone = $('[name=phoneNo]');
      elmPhone.sendKeys('def');
      element(by.css('body')).click();
      elmPhone.sendKeys(protractor.Key.TAB);

      var validateBtn = $('[name=validateForms]');
      validateBtn.click();
      browser.waitForAngular();

      var elmForm1isValid = element(by.binding('Form1.isValid'));
      expect(elmForm1isValid.getText()).toEqual('Form1 isValid: true');

      var elmForm2isValid = element(by.binding('Form2.isValid'));
      expect(elmForm2isValid.getText()).toEqual('Form2 isValid: true');
    });
  });
});