describe('Angular-Validation ngIf/ngShow/ngDisabled Tests:', function () {
  // global variables
  var errorMessages = [
    'ModelData_AreaCode: Field is required. May only contain letters, numbers and dashes. Must be at least 2 characters.',
    'ModelData_AreaName: Field is required.',
    'ModelData_Note: Field is required.',
    'ModelData_Note2: Field is required.',
    'ModelData_Note1: Field is required.'
  ];

  describe('When choosing `more-examples` ngIf/ngShow/ngDisabled', function () {
    it('Should navigate to ngIf/ngShow/ngDisabled home page', function () {
      browser.get('http://localhost/github/angular-validation/more-examples/ngIfShowHideDisabled/index.html');

      // Find the title element
      var titleElement = element(by.css('h2'));

      // Assert that the text element has the expected value.
      // Protractor patches 'expect' to understand promises.
      expect(titleElement.getText()).toEqual('Example of Angular-Validation with "ngIf / ngShow / ngDisabled".');
    });

    it('Should show 2 errors in Validation Summary', function () {
      var valSummary = element.all(by.repeater('item in f1.$validationSummary'));
      expect(valSummary.count()).toBe(2*2); // *2 because there's fieldName & errorMsg

      for(var i = 0; i < valSummary.count(); i++) {
        var lineError = valSummary.get(i);
        expect(lineError.getText()).toEqual(errorMessages[i]);
      }
    });

    it('Should click on Save button and show Validate Count of 2', function () {
      var saveBtn = $('[name=btn_save]');
      saveBtn.click();
      browser.waitForAngular();

      var elmValidationCount = $('[name=validationCount]');
      expect(elmValidationCount.getText()).toEqual('2');
    });

    it('Should click on Show/Enable Notes button, click on Save button and show Validate Count of 5', function () {
      var saveBtn = $('[name=btn_showNotes]');
      saveBtn.click();

      var saveBtn = $('[name=btn_save]');
      saveBtn.click();
      browser.waitForAngular();

      var elmValidationCount = $('[name=validationCount]');
      expect(elmValidationCount.getText()).toEqual('5');
    });

    it('Should show 5 errors in Validation Summary', function () {
      var valSummary = element.all(by.repeater('item in f1.$validationSummary'));
      expect(valSummary.count()).toBe(5*2); // *2 because there's fieldName & errorMsg

      for(var i = 0; i < valSummary.count(); i++) {
        var lineError = valSummary.get(i);
        expect(lineError.getText()).toEqual(errorMessages[i]);
      }
    });

    it('Should click again to Disable Notes button, click on Save button and show Validate Count of 2', function () {
      var saveBtn = $('[name=btn_showNotes]');
      saveBtn.click();

      var saveBtn = $('[name=btn_save]');
      saveBtn.click();
      browser.waitForAngular();

      var elmValidationCount = $('[name=validationCount]');
      expect(elmValidationCount.getText()).toEqual('2');
    });

    it('Should show 2 errors in Validation Summary', function () {
      var valSummary = element.all(by.repeater('item in f1.$validationSummary'));
      expect(valSummary.count()).toBe(2*2); // *2 because there's fieldName & errorMsg

      for(var i = 0; i < valSummary.count(); i++) {
        var lineError = valSummary.get(i);
        expect(lineError.getText()).toEqual(errorMessages[i]);
      }
    });
  });
});