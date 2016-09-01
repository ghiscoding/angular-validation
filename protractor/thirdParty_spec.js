describe('Angular-Validation 3rd Party Addons Tests:', function () {
  // global variables
  var defaultErrorMessages = [
  'select1: Must be a choice inside this list: (John,Jane). Field is required.',
  'select2: Must be a choice inside this list: (Firefox,Chrome).',
  'input1: Must be a choice inside this list: (Tag4,Tag5).',
  'input2: [abc] :: Must be a Tag with a number.'
  ];

  describe('When choosing `more-examples` 3rd Party Addons', function () {
    it('Should navigate to home page', function () {
      browser.get('http://localhost/Github/angular-validation/more-examples/addon-3rdParty/');

      // Find the title element
      var titleElement = element(by.css('h2'));
      expect(titleElement.getText()).toEqual('Validation examples with external 3rd party addons');
    });

    it('Should have multiple errors in validation summary', function () {
      var itemRows = element.all(by.binding('message'));
      var inputName;

      for (var i = 0, j = 0, ln = itemRows.length; i < ln; i++) {
        expect(itemRows.get(i).getText()).toEqual(defaultErrorMessages[i]);
      }
    });

    it('Should click on select1 and choose 1st choice (invalid)', function() {
      browser.sleep(500);
      $('.multiselect-parent button').click();
      browser.waitForAngular();

      element.all(by.repeater('option in options')).get(0).click();

      var elmError = $('.validation-select1');
      expect(elmError.getText()).toEqual('Must be a choice inside this list: (John,Jane).');
    });

    it('Should click on select1 and choose 2nd choice (valid)', function() {
      element.all(by.repeater('option in options')).get(1).click();

      var elmError = $('.validation-select1');
      expect(elmError.getText()).toEqual('');

      // hide back dropdown multi-select
      $('.multiselect-parent button').click();
      browser.waitForAngular();
    });

    it('Should click on select2 and choose 2nd choice (invalid)', function() {
      element.all(by.css('.multiSelect button')).get(0).click();
      browser.waitForAngular();

      element.all(by.repeater('item in filteredModel')).get(1).click();

      var elmError = $('.validation-select2');
      expect(elmError.getText()).toEqual('Must be a choice inside this list: (Firefox,Chrome).');
    });

    it('Should click on select2 and choose 3rd choice (valid)', function() {
      element.all(by.repeater('item in filteredModel')).get(2).click();

      var elmError = $('.validation-select2');
      expect(elmError.getText()).toEqual('');

      element.all(by.css('.multiSelect button')).get(0).click();
      browser.waitForAngular();
    });

    it('Should enter valid text on input1', function() {
      var elmError = $('.validation-input1');
      expect(elmError.getText()).toEqual('Must be a choice inside this list: (Tag4,Tag5).');

      // add a new 'tag4'
      var elmInput = $('[name=input1] input');
          elmInput.click();
          elmInput.sendKeys('tag4');
          elmInput.sendKeys(protractor.Key.ENTER);
          element(by.css('body')).click();
          elmInput.sendKeys(protractor.Key.TAB);

      var elmError = $('.validation-input1');
      expect(elmError.getText()).toEqual('');
    });

    it('Should add an invalid tag in input2 and show 2 errors concatenated', function() {
      // should already have a default error of 1st tag
      var elmError = $('.validation-input2');
      expect(elmError.getText()).toEqual('[abc] :: Must be a Tag with a number.');

      // add a new 'tag4'
      var elmInput = $('[name=input2] input');
          elmInput.click();
          elmInput.sendKeys('xyz');
          elmInput.sendKeys(protractor.Key.ENTER);
          element(by.css('body')).click();
          elmInput.sendKeys(protractor.Key.TAB);

      // get 2 errors concatenated
      expect(elmError.getText()).toEqual('[abc] :: Must be a Tag with a number. [xyz] :: Must be a Tag with a number.');
    });

    it('Should remove last 2 invalid tags on input2 and make input valid', function() {
      var container = element(by.css("div#tag2"));
      var rows = container.all(by.repeater('tag in tagList.items'));

      // remove the second last, then check error message
      rows.get(2).$('.remove-button').click();
      var elmError = $('.validation-input2');
      expect(elmError.getText()).toEqual('[xyz] :: Must be a Tag with a number.');

      // remove the last one left, then error message should be empty
      rows.get(2).$('.remove-button').click();
      expect(elmError.getText()).toEqual('');
    });

    it('Should expect validation summary to be empty and save button enabled', function () {
      // validation summary should become empty
      var itemRows = element.all(by.binding('message'));
      expect(itemRows.count()).toBe(0);

      var elmSubmit1 = $('[name=save_btn]');
      expect(elmSubmit1.isEnabled()).toBe(true);
    });

  });
});