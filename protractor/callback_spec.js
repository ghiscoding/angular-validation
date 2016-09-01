describe('Angular-Validation callback Validation Tests:', function () {
  // global variables
  var formElementNames = ['firstName1', 'lastName1', 'firstName2', 'lastName2'];
  var firstNameElements = ['firstName1', 'firstName2'];
  var lastNameElements = ['lastName1', 'lastName2'];
  var firstNames = ['John', 'Doe'];
  var lastNames = ['Jane', 'Smith'];
  var errorMessages = [
  	'First name is required',
  	'Last name is required',
  	'First name is required',
  	'Last name is required'
  ]
  var formIsValidBindings = ['vmd.formValid1', 'vms.formValid2'];
  var fullNameBindings = ['vmd.fullName1', 'vms.fullName2'];
  var errorFromPromise = 'Must be at least 2 characters. Returned error from promise.';
  var defaultErrorMessage = 'May only contain letters. Must be at least 2 characters. Field is required.';
  var errorTooShort = [
    'Must be at least 2 characters. Alternate error message.',
    'Must be at least 2 characters. Returned error from custom function.',
    'Must be at least 2 characters. Alternate error message.',
    'Must be at least 2 characters. Returned error from custom function.'
  ];
  var oneChar = ['a', 'd', 'a', 'd'];
  var validInputTexts = ['abc', 'def', 'abc', 'def'];

  describe('When choosing `more-examples` Validation Callback', function () {
    it('Should navigate to home page', function () {
      browser.get('http://localhost/Github/angular-validation/more-examples/validationCallback/');

      // Find the title element
      var titleElement = element(by.css('h2'));
      expect(titleElement.getText()).toEqual('Example of Validation Callback');
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

    it('Should enter First Name on both forms and have undefined Last Name', function() {
      for (var i = 0, ln = firstNames.length; i < ln; i++) {
        var elmInput = $('[name=' + firstNameElements[i] + ']');
        elmInput.click();
        elmInput.sendKeys(firstNames[i]);

        // form should show invalid
        var formValid = element(by.binding(formIsValidBindings[i]));
        expect(formValid.getText()).toEqual('Form is valid: false');

        // Full name should show the first name we just entered + undefined as last name
        var fullName = element(by.binding(fullNameBindings[i]));
        expect(fullName.getText()).toEqual('Full Name: ' + firstNames[i] + ' undefined');
      }
    });

    it('Should check that both submit buttons are disabled', function() {
      var elmSubmit1 = $('[name=btn_ngDisabled1]');
      expect(elmSubmit1.isEnabled()).toBe(false);

      var elmSubmit2 = $('[name=btn_ngDisabled2]');
      expect(elmSubmit2.isEnabled()).toBe(false);
    });

    it('Should enter Last Name on both forms and have Full Name', function() {
      for (var i = 0, ln = firstNames.length; i < ln; i++) {
        var elmInput = $('[name=' + lastNameElements[i] + ']');
        elmInput.click();
        elmInput.sendKeys(lastNames[i]);

        // form should show invalid
        var formValid = element(by.binding(formIsValidBindings[i]));
        expect(formValid.getText()).toEqual('Form is valid: true');

        // Full name should show the first name we just entered + undefined as last name
        var fullName = element(by.binding(fullNameBindings[i]));
        expect(fullName.getText()).toEqual('Full Name: ' + firstNames[i] + ' ' + lastNames[i]);
      }
    });

    it('Should check that both submit buttons are now enabled', function() {
      var elmSubmit1 = $('[name=btn_ngDisabled1]');
      expect(elmSubmit1.isEnabled()).toBe(true);

      var elmSubmit2 = $('[name=btn_ngDisabled2]');
      expect(elmSubmit2.isEnabled()).toBe(true);
    });

  });
});