describe('Angular-Validation Full Tests:', function () {
  // global variables
  var requiredErrorMessages = {
    'en': 'Field is required.',
    'es': 'El campo es requerido.',
    'fr': 'Le champ est requis.',
    'no': 'Feltet er påkrevd.',
    'ru': 'Поле обязательно для заполнения.'
  };
  var languages = ['en', 'es', 'fr', 'no', 'ru'];
  var types = ['Directive', 'Service'];
  var btnGoTo = ['btn_goto_directive', 'btn_goto_service'];
  var validations = explodeAndFlattenValidatorArray(loadData());

  for(var k = 0, kln = types.length; k < kln; k++) {
    // because we are dealing with promises, we better use closures to pass certain variables
    (function(types, k) {
      describe('When clicking on top menu Angular-Validation >> ' + types[k], function () {
        it('Should navigate to Angular-Validation home page', function () {
          browser.get('http://localhost/Github/angular-validation/full-tests');

          // Find the title element
          var titleElement = element(by.css('h1'));

          // Assert that the text element has the expected value.
          // Protractor patches 'expect' to understand promises.
          expect(titleElement.getText()).toEqual('Angular-Validation Directive|Service (ghiscoding)');
        });

        it('Should navigate to TestingForm' + types[k] + ' page', function () {
          browser.get('http://localhost/Github/angular-validation/full-tests');

          var anchorLink = $('[name=btn_goto_' + types[k] +']');
          anchorLink.click();
          browser.waitForAngular();

          // Find the sub-title element
          var titleElement = element(by.css('h3'));
          expect(titleElement.getText()).toEqual(types[k]);
        });

        it('Should be loading locale: en', function () {
          var elmBtnEnglish = $('button[name=btn_english]');
          elmBtnEnglish.click();
          browser.waitForAngular();
        });

        it('Should click and blur on each form elements and error message should display on each of them', function () {
          for (var i = 0, ln = validations.length; i < ln; i++) {
            var elmInput = $('[name=input' + i + ']');
            elmInput.click();
            element(by.css('body')).click();
            elmInput.sendKeys(protractor.Key.TAB);
            //$('[for=input' + i + ']').click();

            var elmError = $('.validation-input' + i);
            var errorMsg = (validations[i].validator === 'maxLen' || validations[i].validator === 'max_len')
              ? requiredErrorMessages[languages[0]]
              : requiredErrorMessages[languages[0]] + ' ' + validations[i].error_message[languages[0]]
            expect(elmError.getText()).toEqual(errorMsg);
          }
        });

        // --
        // It seems that Protractor doesn't let us run indefinetely into a describe call (even with higher timeout)
        // So we have no choice but to run only a max of 2 valid/invalid checks

        it('Should enter valid text and make error go away', function () {
          for (var i = 0, ln = validations.length; i < ln; i++) {
            var elmInput = $('[name=input' + i + ']');
            elmInput.click();
              for(var j = 0, jln = validations[i].valid_data.length; j < jln; j++) {
                var data = validations[i].valid_data[j];
                (function(elmInput, data, i) {
                  elmInput.clear().then(function() {
                    elmInput.sendKeys(data);
                    element(by.css('body')).click();
                    elmInput.sendKeys(protractor.Key.TAB);
                    //$('[for=input' + i + ']').click();
                    var elmError = $('.validation-input' + i);
                    expect(elmError.getText()).toEqual('');
                  });
                })(elmInput, data, i);
              }
          }
        }, 620000);

        it('Should check that ngDisabled button is now enabled', function() {
          var elmSubmit1 = $('[name=btn_ngDisabled]');
          expect(elmSubmit1.isEnabled()).toBe(true);
        });

        it('Should enter invalid text and make error appear', function () {
          for (var i = 0, ln = validations.length; i < ln; i++) {
            var elmInput = $('[name=input' + i + ']');
            elmInput.click();
              for(var j = 0, jln = 2; j < jln; j++) {
                if(jln > validations[i].length) {
                  break;
                }
                var data = validations[i].invalid_data[j];
                (function(elmInput, data, i) {
                  elmInput.clear().then(function() {
                    elmInput.sendKeys(data);
                    element(by.css('body')).click();
                    elmInput.sendKeys(protractor.Key.TAB);
                    //$('[for=input' + i + ']').click();
                    var elmError = $('.validation-input' + i);
                    expect(elmError.getText()).toEqual(validations[i].error_message[languages[0]]);
                  });
                })(elmInput, data, i);
              }
          }
        }, 620000);

      });         // describe: When clicking on top menu ...
    })(types, k); // closure
  }               // for()

});

// explode the validators data, a validator might have aliases and if that is the case then exploded them into multiple validators
function explodeAndFlattenValidatorArray(data) {
  var tempArray = [];
  var obj = {};

  for(var i=0, ln = data.length; i < ln; i++) {
    obj = {
      validation: data[i].validator + (typeof data[i].params !== "undefined" ? ':' + data[i].params : ''),
      validator: data[i].validator,
      invalid_data: data[i].invalid_data,
      valid_data: data[i].valid_data,
      error_message: data[i].error_message
    };
    tempArray.push(obj);
    if(typeof data[i].aliases !== "undefined") {
      for(var j = 0, jln = data[i].aliases.length; j < jln; j++) {
        var validator = data[i].validator;
        if(!!data[i].params) {
          validator += data[i].params;
        }
        obj = {
          validation: data[i].aliases[j] + (typeof data[i].params !== "undefined" ? ':' + data[i].params : ''),
          validator: data[i].aliases[j],
          invalid_data: data[i].invalid_data,
          valid_data: data[i].valid_data,
          error_message: data[i].error_message
        };
        tempArray.push(obj);
      }
    }
  }

  return tempArray;
}

function loadData() {
  return [
      {
        'validator': 'alpha',
        'invalid_data': ['abc-def', 'abc def', '@', '#', '123', '{|\\}'],
        'valid_data': ['abcdefghijklmnopqrstuvwxyz', 'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ', 'ążźćśłńęàáâãäåçèéêëìíîïðòóôõöùúûüýÿ'],
        'error_message': {
          'en': 'May only contain letters.',
          'es': 'Unicamente puede contener letras.',
          'fr': 'Ne doit contenir que des lettres.',
          'no': 'Kan bare inneholde bokstaver.',
          'ru': 'Может содержать только буквы.'
        }
      },
      {
        'validator': 'alphaSpaces',
        'aliases': ['alpha_spaces'],
        'invalid_data': ['abc-def', 'abc(def)', '@', '#', '123', '{|\\}'],
        'valid_data': ['abcdefghijklmnopqrstuvwxyz', 'ÀÁÂÃÄÅ ÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ', 'ążźćśłńęàáâãäå çèéêëìíîïðòóôõöùúûüýÿ'],
        'error_message': {
          'en': 'May only contain letters and spaces.',
          'es': 'Unicamente puede contener letras y espacios.',
          'fr': 'Ne doit contenir que des lettres et espaces.',
          'no': 'Kan bare inneholde bokstaver og mellomrom.',
          'ru': 'Может содержать только буквы и пробелы.'
        }
      },
      {
        'validator': 'alphaNum',
        'aliases': ['alpha_num'],
        'invalid_data': ['abc-def', 'abc(def)', '@', '#', '{|\\}'],
        'valid_data': ['1234567890', 'abcdefghijklmnopqrstuvwxyz', 'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ', 'ążźćśłńęàáâãäåçèéêëìíîïðòóôõöùúûüýÿ'],
        'error_message': {
          'en': 'May only contain letters and numbers.',
          'es': 'Unicamente puede contener letras y números.',
          'fr': 'Ne doit contenir que des lettres et nombres.',
          'no': 'Kan bare inneholde bokstaver og tall.',
          'ru': 'Может содержать только буквы и цифры.'
        }
      },
      {
        'validator': 'alphaNumSpaces',
        'aliases': ['alpha_num_spaces'],
        'invalid_data': ['abc-def', 'abc(def)', '@', '#'],
        'valid_data': ['1234567890', 'abcdefghijkl mnopqrstuvwxyz', 'ÀÁÂÃÄÅ ÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ', 'ążźćśłńęàáâãäå çèéêëìíîïðòóôõöùúûüýÿ'],
        'error_message': {
          'en': 'May only contain letters, numbers and spaces.',
          'es': 'Unicamente puede contener letras, números y espacios.',
          'fr': 'Ne doit contenir que des lettres, nombres et espaces.',
          'no': 'Kan bare inneholde bokstaver, tall og mellomrom.',
          'ru': 'Может содержать только буквы, цифры и пробелы.'
        }
      },
      {
        'validator': 'alphaDash',
        'aliases': ['alpha_dash'],
        'invalid_data': ['abc(def)', '@', '#', '{|\\}'],
        'valid_data': ['1234567890', 'abcdefg-hijklmnopqrstuvwxyz', 'ÀÁÂÃÄÅ--ÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ', 'ążźćśłńęàáâãäåçèéêëìíîïðòóôõöùúûüýÿ'],
        'error_message': {
          'en': "May only contain letters, numbers and dashes.",
          'es': "Unicamente puede contener letras, números y guiones.",
          'fr': "Ne doit contenir que des lettres, nombres et des tirets.",
          'no': "Kan bare inneholde bokstaver, tall og bindestrek.",
          'ru': "Может содержать только буквы, цифры и дефисы."
        }
      },
      {
        'validator': 'alphaDashSpaces',
        'aliases': ['alpha_dash_spaces'],
        'invalid_data': ['abc(def)', '@', '#', '{|\\}'],
        'valid_data': ['123456-7890', 'abcdefg-hijklmn opqrstuvwxyz', 'ÀÁÂÃÄÅ--ÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ', 'ążźćśłńęàáâãäå çèéêëìíîïðòóôõöùúûüýÿ'],
        'error_message': {
          'en': "May only contain letters, numbers, dashes and spaces.",
          'es': "Unicamente puede contener letras, números, guiones y espacios.",
          'fr': "Ne doit contenir que des lettres, nombres, tirets et espaces.",
          'no': "Kan bare inneholde bokstaver, tall, bindestrek og mellomrom.",
          'ru': "Может содержать только буквы, цифры, дефисы и пробелы."
        }
      },
      {
        'validator': 'betweenLen',
        'aliases': ['between_len'],
        'params': '1,5',
        'invalid_data': ['123456', 'abcdefg', '1234567890'],
        'valid_data': ['12345', 'abcde', '!@#$%', '1\r234'],
        'error_message': {
          'en': "Text must be between 1 and 5 characters in length.",
          'es': "El número de caracteres debe de estar entre 1 y 5.",
          'fr': "Le texte doit être entre 1 et 5 caractères de longueur.",
          'no': "Teksten må være mellom 1 og 5 tegn lang.",
          'ru': "Текст должен быть длиной от 1 до 5 символов."
        }
      },
      {
        'validator': 'betweenNum',
        'aliases': ['between_num'],
        'params': '5,15',
        'invalid_data': ['1', '4', '100', 'a', '$'],
        'valid_data': ['5', '15'],
        'error_message': {
          'en': "Needs to be a numeric value, between 5 and 15.",
          'es': "El valor debe ser númerico y estar entre 5 y 15.",
          'fr': "Doit être une valeur numérique, entre 5 et 15.",
          'no': "Det må være en numerisk verdi, mellom 5 og 15.",
          'ru': "Должно быть числом между 5 и 15.",
        }
      },
      {
        'validator': 'boolean',
        'invalid_data': ['abc', '2', 'falsy'],
        'valid_data': ['true', 'false', 'True', 'False', '0', '1'],
        'error_message': {
          'en': "May only contain a true or false value.",
          'es': "Unicamente puede contener el texto verdadero ó falso.",
          'fr': "Doit contenir qu'une valeur vraie ou fausse.",
          'no': "Kan bare inneholde en sann eller usann verdi.",
          'ru': "Может содержать только значение права или ложь."
        }
      },
      {
        'validator': 'creditCard',
        'aliases': ['credit_card'],
        'invalid_data': ['30-5693-0902-5904', '31169309025904'],
        'valid_data': ['4538 1212 2020 3030', '5431-1111-1111-1111', '30569309025904', '4538123456789012'],
        'error_message': {
          'en': "Must be a valid credit card number.",
          'es': "Debe contener un número de tarjeta de crédito valido.",
          'fr': "Doit être un numéro de carte de crédit valide.",
          'no': "Må være et gyldig kredittkortnummer.",
          'ru': "Должно быть действительным номером кредитной карты."
        }
      },
      {
        'validator': 'dateEuro',
        'aliases': ['date_euro'],
        'invalid_data': ['abc', '32-12-2000', '00-01-2001', '29-02-2012'],
        'valid_data': ['30-12-2001', '29-02-2000', '05.05.2005'],
        'error_message': {
          'en': "Must be a valid date format (dd-mm-yyyy) OR (dd/mm/yyyy).",
          'es': "Debe contener una fecha valida con formato (dd-mm-yyyy) ó (dd/mm/yyyy).",
          'fr': "Doit être un format de date valide (dd-mm-yyyy) OU (dd/mm/yyyy).",
          'no': "Må være et gyldig datoformat (dd-mm-yyyy) eller (dd/mm/yyyy).",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yyyy) или (dd/mm/yyyy)."
        }
      },
      {
        'validator': 'dateEuroBetween',
        'aliases': ['date_euro_between', 'betweenDateEuro', 'between_date_euro'],
        'params': '01-01-2000,28-02-2001',
        'invalid_data': ['abc', '32-12-2000', '00-01-2001', '30-13-2012', '31-12-2000', '01-03-2001'],
        'valid_data': ['01-02-2001', '29-02-2000', '05.02.2001'],
        'error_message': {
          'en': "Needs to be a valid date format (dd-mm-yyyy) OR (dd/mm/yyyy) between 01-01-2000 and 28-02-2001.",
          'es': "Debe contener una fecha valida entre 01-01-2000 y 28-02-2001 con formato (dd-mm-yyyy) ó (dd/mm/yyyy).",
          'fr': "Doit être un format de date valide (dd-mm-yyyy) OU (dd/mm/yyyy) entre 01-01-2000 et 28-02-2001.",
          'no': "Må være et gyldig datoformat (dd-mm-yyyy) eller (dd/mm/yyyy) mellom 01-01-2000 and 28-02-2001. ",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yyyy) или (dd/mm/yyyy) между 01-01-2000 и 28-02-2001. "
        }
      },
      {
        'validator': 'dateEuroMax',
        'aliases': ['date_euro_max', 'maxDateEuro', 'max_date_euro'],
        'params': '30-05-2012',
        'invalid_data': ['abc', '32-12-2000', '00-01-2001', '30-13-2012', '01-06-2012'],
        'valid_data': ['01/01/2001', '30-05-2012', '05.05.2005'],
        'error_message': {
          'en': "Needs to be a valid date format (dd-mm-yyyy) OR (dd/mm/yyyy), equal to, or lower than 30-05-2012.",
          'es': "Debe contener una fecha valida igual ó menor que 30-05-2012 con formato (dd-mm-yyyy) ó (dd/mm/yyyy).",
          'fr': "Doit être une date valide (dd-mm-yyyy) OU (dd/mm/yyyy), égale ou inférieure à 30-05-2012.",
          'no': "Må være et gyldig datoformat (dd-mm-yyyy) eller (dd/mm/yyyy), lik eller før 30-05-2012.",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yyyy) или (dd/mm/yyyy), равное или меньше чем 30-05-2012."
        }
      },
      {
        'validator': 'dateEuroMin',
        'aliases': ['date_euro_min', 'minDateEuro', 'min_date_euro'],
        'params': '25-05-2012',
        'invalid_data': ['abc', '24-05-2012', '32-12-2000', '00-01-2001', '30-13-2012'],
        'valid_data': ['25/05/2012', '30-05-2012', '05.05.2015'],
        'error_message': {
          'en': "Needs to be a valid date format (dd-mm-yyyy) OR (dd/mm/yyyy), equal to, or higher than 25-05-2012.",
          'es': "Debe contener una fecha valida igual ó mayor que 25-05-2012 con formato (dd-mm-yyyy) ó (dd/mm/yyyy).",
          'fr': "Doit être une date valide (dd-mm-yyyy) OU (dd/mm/yyyy), égale ou supérieure à 25-05-2012.",
          'no': "Må være et gyldig datoformat (dd-mm-yyyy) eller (dd/mm/yyyy), lik eller etter 25-05-2012.",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yyyy) или (dd/mm/yyyy), равное или больше чем 25-05-2012."
        }
      },
      {
        'validator': 'dateEuroShort',
        'aliases': ['date_euro_short'],
        'params': '25-05-12',
        'invalid_data': ['32-12-00', '00-01-01', '30-13-12', '01-06-2012'],
        'valid_data': ['25/05/12', '30-05-12', '05.05.05'],
        'error_message': {
          'en': "Must be a valid date format (dd-mm-yy) OR (dd/mm/yy).",
          'es': "Debe contener una fecha valida con formato (dd-mm-yy) o (dd/mm/yy).",
          'fr': "Doit être un format de date valide (dd-mm-yy) OU (dd/mm/yy).",
          'no': "Må være et gyldig datoformat (dd-mm-yy) eller (dd/mm/yy).",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yy) или (dd/mm/yy)."
        }
      },
      {
        'validator': 'dateEuroShortBetween',
        'aliases': ['date_euro_short_between', 'betweenDateEuroShort', 'between_date_euro_short'],
        'params': '25-05-12,04-06-12',
        'invalid_data': ['24-05-12', '32-12-00', '00-01-01', '30-13-12', '24-05-12', '05-06-12', '01-06-2012'],
        'valid_data': ['25/05/12', '30.05.12', '04-06-12'],
        'error_message': {
          'en': "Needs to be a valid date format (dd-mm-yy) OR (dd/mm/yy) between 25-05-12 and 04-06-12.",
          'es': "Debe contener una fecha valida entre 25-05-12 y 04-06-12 con formato (dd-mm-yy) o (dd/mm/yy).",
          'fr': "Doit être un format de date valide (dd-mm-yy) OU (dd/mm/yy) entre 25-05-12 et 04-06-12.",
          'no': "Må være et gyldig datoformat (dd-mm-yy) eller (dd/mm/yy) mellom 25-05-12 and 04-06-12.",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yy) или (dd/mm/yy) между 25-05-12 и 04-06-12."
        }
      },
      {
        'validator': 'dateEuroShortMax',
        'aliases': ['date_euro_short_max', 'maxDateEuroShort', 'max_date_euro_short'],
        'params': '04-06-12',
        'invalid_data': ['32-12-00', '00-01-01', '30-13-12', '05-06-12', '01-06-2012'],
        'valid_data': ['25/05/12', '04-06-12', '05.05.05'],
        'error_message': {
          'en': "Needs to be a valid date format (dd-mm-yy) OR (dd/mm/yy), equal to, or lower than 04-06-12.",
          'es': "Debe contener una fecha valida igual ó menor que 04-06-12 con formato (dd-mm-yy) ó (dd/mm/yy).",
          'fr': "Doit être une date valide (dd-mm-yy) OU (dd/mm/yy), égale ou inférieure à 04-06-12.",
          'no': "Må være et gyldig datoformat (dd-mm-yy) eller (dd/mm/yy), lik eller før 04-06-12.",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yy) или (dd/mm/yy), равное или меньше чем 04-06-12."
        }
      },
      {
        'validator': 'dateEuroShortMin',
        'aliases': ['date_euro_short_min', 'minDateEuroShort', 'min_date_euro_short'],
        'params': '04-06-12',
        'invalid_data': ['32-12-00', '00-01-01', '30-13-12', '03-06-12', '01-06-2012'],
        'valid_data': ['25/07/12', '04-06-12', '05.05.15'],
        'error_message': {
          'en': "Needs to be a valid date format (dd-mm-yy) OR (dd/mm/yy), equal to, or higher than 04-06-12.",
          'es': "Debe contener una fecha valida igual ó mayor que 04-06-12 con formato (dd-mm-yy) ó (dd/mm/yy).",
          'fr': "Doit être une date valide (dd-mm-yy) OU (dd/mm/yy), égale ou supérieure à 04-06-12.",
          'no': "Må være et gyldig datoformat (dd-mm-yy) eller (dd/mm/yy), lik eller etter 04-06-12.",
          'ru': "Должно быть допустимым форматом даты (dd-mm-yy) или (dd/mm/yy), равное или больше чем 04-06-12."
        }
      },
      {
        'validator': 'dateIso',
        'aliases': ['date_iso'],
        'invalid_data': ['20001230', '2000-12-32', '2000-13-01', '2012/07/25'],
        'valid_data': ['2012-12-31', '1954-01-01'],
        'error_message': {
          'en': "Must be a valid date format (yyyy-mm-dd).",
          'es': "Debe contener una fecha valida con formato (yyyy-mm-dd).",
          'fr': "Doit être un format de date valide (yyyy-mm-dd).",
          'no': "Må være et gyldig datoformat (yyyy-mm-dd).",
          'ru': "Должно быть допустимым форматом даты (yyyy-mm-dd)."
        }
      },
      {
        'validator': 'dateIsoBetween',
        'aliases': ['date_iso_between', 'betweenDateIso', 'between_date_iso'],
        'params': '2012-05-25,2012-06-04',
        'invalid_data': ['2012-24-05', '2032-12-00', '2000-01-00', '2012-05-24', '2012-06-05'],
        'valid_data': ['2012-05-25', '2012-06-04'],
        'error_message': {
          'en': "Needs to be a valid date format (yyyy-mm-dd) between 2012-05-25 and 2012-06-04.",
          'es': "Debe contener una fecha valida entre 2012-05-25 y 2012-06-04 con formato (yyyy-mm-dd).",
          'fr': "Doit être un format de date valide (yyyy-mm-dd) entre 2012-05-25 et 2012-06-04.",
          'no': "Må være et gyldig datoformat (yyyy-mm-dd) mellom 2012-05-25 and 2012-06-04.",
          'ru': "Должно быть допустимым форматом даты (yyyy-mm-dd) между 2012-05-25 and 2012-06-04."
        }
      },
      {
        'validator': 'dateIsoMax',
        'aliases': ['date_iso_max', 'maxDateIso', 'max_date_iso'],
        'params': '2012-05-25',
        'invalid_data': ['2012-24-05', '2032-12-00', '2000-01-00', '2012-05-26'],
        'valid_data': ['2012-05-25', '2000-06-04'],
        'error_message': {
          'en': "Needs to be a valid date format (yyyy-mm-dd), equal to, or lower than 2012-05-25.",
          'es': "Debe contener una fecha valida igual ó menor que 2012-05-25 con formato (yyyy-mm-dd).",
          'fr': "Doit être une date valide (yyyy-mm-dd), égale ou inférieure à 2012-05-25.",
          'no': "Må være et gyldig datoformat (yyyy-mm-dd), lik eller før 2012-05-25.",
          'ru': "Должно быть допустимым форматом даты (yyyy-mm-dd), равное или меньше чем 2012-05-25."
        }
      },
      {
        'validator': 'dateIsoMin',
        'aliases': ['date_iso_min', 'minDateIso', 'min_date_iso'],
        'params': '2012-05-25',
        'invalid_data': ['2012-24-05', '2032-12-00', '2000-01-00', '2012-05-24'],
        'valid_data': ['2012-05-25', '2012-06-04'],
        'error_message': {
          'en': "Needs to be a valid date format (yyyy-mm-dd), equal to, or higher than 2012-05-25.",
          'es': "Debe contener una fecha valida igual ó mayor que 2012-05-25 con formato (yyyy-mm-dd).",
          'fr': "Doit être une date valide (yyyy-mm-dd), égale ou supérieure à 2012-05-25.",
          'no': "Må være et gyldig datoformat (yyyy-mm-dd), lik eller etter 2012-05-25.",
          'ru': "Должно быть допустимым форматом даты (yyyy-mm-dd), равное или больше чем 2012-05-25."
        }
      },
      {
        'validator': 'dateUs',
        'aliases': ['date_us'],
        'invalid_data': ['02-29-2001', '00-01-2001', '13-30-2012'],
        'valid_data': ['01-01-2001', '02/29/2000', '05.15.2005'],
        'error_message': {
          'en': "Must be a valid date format (mm/dd/yyyy) OR (mm-dd-yyyy).",
          'es': "Debe contener una fecha valida con formato (mm/dd/yyyy) ó (mm-dd-yyyy).",
          'fr': "Doit être un format de date valide (mm/dd/yyyy) OU (mm-dd-yyyy).",
          'no': "Må være et gyldig datoformat (mm/dd/yyyy) eller (mm-dd-yyyy).",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yyyy) или (mm-dd-yyyy)."
        }
      },
      {
        'validator': 'dateUsBetween',
        'aliases': ['date_us_between', 'betweenDateUs', 'between_date_us'],
        'params': '01/01/1990,12/31/2015',
        'invalid_data': ['00/02/1990', '01/01/2016', '12/31/15'],
        'valid_data': ['01-01-1990', '02/29/2000', '05.15.2015'],
        'error_message': {
          'en': "Needs to be a valid date format (mm/dd/yyyy) OR (mm-dd-yyyy) between 01/01/1990 and 12/31/2015.",
          'es': "Debe contener una fecha valida entre 01/01/1990 y 12/31/2015 con formato (mm/dd/yyyy) ó (mm/dd/yyyy).",
          'fr': "Doit être un format de date valide (mm/dd/yyyy) OU (mm-dd-yyyy) entre 01/01/1990 et 12/31/2015.",
          'no': "Må være et gyldig datoformat (mm/dd/yyyy) eller (mm-dd-yyyy) mellom 01/01/1990 and 12/31/2015.",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yyyy) или (mm-dd-yyyy) между 01/01/1990 и 12/31/2015.",
        }
      },
      {
        'validator': 'dateUsMax',
        'aliases': ['date_us_max', 'maxDateUs', 'max_date_us'],
        'params': '01/01/1990',
        'invalid_data': ['00/02/1990', '02/01/1990', '12/31/15'],
        'valid_data': ['01-01-1990', '12/31/1989', '01.12.1900'],
        'error_message': {
          'en': "Needs to be a valid date format (mm/dd/yyyy) OR (mm-dd-yyyy), equal to, or lower than 01/01/1990.",
          'es': "Debe contener una fecha valida igual ó menor que 01/01/1990 con formato (mm/dd/yyyy) ó (mm/dd/yyyy).",
          'fr': "Doit être une date valide (mm/dd/yyyy) OU (mm-dd-yyyy), égale ou inférieure à 01/01/1990.",
          'no': "Må være et gyldig datoformat (mm/dd/yyyy) eller (mm-dd-yyyy), lik eller før 01/01/1990.",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yyyy) или (mm-dd-yyyy), равное или меньше чем 01/01/1990."
        }
      },
      {
        'validator': 'dateUsMin',
        'aliases': ['date_us_min', 'minDateUs', 'min_date_us'],
        'params': '01/01/1990',
        'invalid_data': ['00/02/1990', '12/31/1989', '12/31/15'],
        'valid_data': ['01-01-1990', '02/29/2000', '12.31.1999'],
        'error_message': {
          'en': "Needs to be a valid date format (mm/dd/yyyy) OR (mm-dd-yyyy), equal to, or higher than 01/01/1990.",
          'es': "Debe contener una fecha valida igual ó mayor que 01/01/1990 con formato (mm/dd/yyyy) ó (mm/dd/yyyy).",
          'fr': "Doit être une date valide (mm/dd/yyyy) OU (mm-dd-yyyy), égale ou supérieure à 01/01/1990.",
          'no': "Må være et gyldig datoformat (mm/dd/yyyy) eller (mm-dd-yyyy), lik eller etter 01/01/1990.",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yyyy) или (mm-dd-yyyy), равное или больше чем 01/01/1990."
        }
      },
      {
        'validator': 'dateUsShort',
        'aliases': ['date_us_short'],
        'invalid_data': ['32-12-00', '00-01-01', '13-30-12'],
        'valid_data': ['01-01-01', '12/30/01', '05.15.05'],
        'error_message': {
          'en': "Must be a valid date format (mm/dd/yy) OR (mm-dd-yy).",
          'es': "Debe contener una fecha valida con formato (mm/dd/yy) ó (mm-dd-yy).",
          'fr': "Doit être un format de date valide (mm/dd/yy) OU (mm-dd-yy).",
          'no': "Må være et gyldig datoformat (mm/dd/yy) eller (mm-dd-yy).",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yy) или (mm-dd-yy)."
        }
      },
      {
        'validator': 'dateUsShortBetween',
        'aliases': ['date_us_short_between', 'betweenDateUsShort', 'between_date_us_short'],
        'params': '01/01/90,12/31/15',
        'invalid_data': ['00/02/90', '01/01/16', '12/31/15', '12/31/2015'],
        'valid_data': ['01-01-90', '12/31/15', '05.15.15'],
        'error_message': {
          'en': "Needs to be a valid date format (mm/dd/yy) OR (mm-dd-yy) between 01/01/90 and 12/31/15.",
          'es': "Debe contener una fecha valida entre 01/01/90 y 12/31/15 con formato (mm/dd/yy) ó (mm/dd/yy).",
          'fr': "Doit être un format de date valide (mm/dd/yy) OU (mm-dd-yy) entre 01/01/90 et 12/31/15.",
          'no': "Må være et gyldig datoformat (mm/dd/yy) eller (mm-dd-yy) between 01/01/90 and 12/31/15.",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yy) или (mm-dd-yy) между 01/01/90 и 12/31/15."
        }
      },
      {
        'validator': 'dateUsShortMax',
        'aliases': ['date_us_short_max', 'maxDateUsShort', 'max_date_us_short'],
        'params': '01/01/90',
        'invalid_data': ['00/02/90', '02/01/90', '12/31/15', '12/31/2015'],
        'valid_data': ['01-01-90', '12/31/89', '01.12.89'],
        'error_message': {
          'en': "Needs to be a valid date format (mm/dd/yy) OR (mm-dd-yy), equal to, or lower than 01/01/90.",
          'es': "Debe contener una fecha valida igual ó menor que 01/01/90 con formato (mm/dd/yy) ó (mm/dd/yy).",
          'fr': "Doit être une date valide (mm/dd/yy) OU (mm-dd-yy), égale ou inférieure à 01/01/90.",
          'no': "Må være et gyldig datoformat (mm/dd/yy) eller (mm-dd-yy), lik eller før 01/01/90.",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yy) или (mm-dd-yy), равное или меньше чем 01/01/90."
        }
      },
      {
        'validator': 'dateUsShortMin',
        'aliases': ['date_us_short_min', 'minDateUsShort', 'min_date_us_short'],
        'params': '01/01/90',
        'invalid_data': ['00/02/90', '12/31/89', '31/12/15', '12/31/2015'],
        'valid_data': ['01-01-90', '02/28/90', '05.15.05'],
        'error_message': {
          'en': "Needs to be a valid date format (mm/dd/yy) OR (mm-dd-yy), equal to, or higher than 01/01/90.",
          'es': "Debe contener una fecha valida igual ó mayor que 01/01/90 con formato (mm/dd/yy) ó (mm/dd/yy).",
          'fr': "Doit être une date valide (mm/dd/yy) OU (mm-dd-yy), égale ou supérieure à 01/01/90.",
          'no': "Må være et gyldig datoformat (mm/dd/yy) eller (mm-dd-yy), lik eller etter 01/01/90.",
          'ru': "Должно быть допустимым форматом даты (mm/dd/yy) или (mm-dd-yy), равное или больше чем 01/01/90."
        }
      },
      {
        'validator': 'digits',
        'params': '3',
        'invalid_data': ['12a', '12.2', '12', '12,3'],
        'valid_data': ['123'],
        'error_message': {
          'en': "Must be 3 digits.",
          'es': "Debe ser 3 dígitos.",
          'fr': "Doit être 3 chiffres.",
          'no': "Må være 3 sifre.",
          'ru': "Должно быть 3 цифры."
        }
      },
      {
        'validator': 'digitsBetween',
        'aliases': ['digits_between'],
        'params': '1,5',
        'invalid_data': ['123456', 'abc', '12.5', '-2'],
        'valid_data': ['12345', '9'],
        'error_message': {
          'en': "Must be between 1 and 5 digits.",
          'es': "Debe ser entre 1 y 5 dígitos.",
          'fr': "Doit être entre 1 et 5 chiffres.",
          'no': "Må være mellom 1 og 5 siffer.",
          'ru': "Должно быть между 1 и 5 цифр."
        }
      },
      {
        'validator': 'email',
        'invalid_data': ['g$g.com', 'g@g,com', '.my@email.com.', 'some space@hotmail.com'],
        'valid_data': ['nickname@domain', 'other.email-with-dash@some-company.com', 'кокер@спаниель.рф', 'hola.ążźćśłńęàáâãäåæçèéêëœìíïîðòóôõöøùúûñüýÿ@español.com'],
        'error_message': {
          'en': "Must be a valid email address.",
          'es': "Debe contener una dirección de correo electronico valida.",
          'fr': "Doit être une adresse courriel valide.",
          'no': "Må være en gyldig epostadresse.",
          'ru': "Должно быть допустимым адресом электронной почты."
        }
      },
      {
        'validator': 'exactLen',
        'aliases': ['exact_len'],
        'params': '11',
        'invalid_data': ['1234567890', 'abcdefghijkl'],
        'valid_data': ['12345678901', 'abcdefghijk'],
        'error_message': {
          'en': "Must have a length of exactly 11 characters.",
          'es': "Debe contener exactamente 11 caracteres.",
          'fr': "Doit être d'une longueur fixe de 11 caractères.",
          'no': "Må være nøyaktig 11 tegn lang.",
          'ru': "Должно быть длиной в размере точно 11 символов."
        }
      },
      {
        'validator': 'float',
        'invalid_data': ['12', '12.', 'abc', '12,3', '-12.3', '+12.3'],
        'valid_data': ['.5', '0.5', '12.3'],
        'error_message': {
          'en': "May only contain a positive float value (integer excluded).",
          'es': "Debe contener un número decimal positivo (Los números enteros no son validos).",
          'fr': "Doit être obligatoirement un nombre flottant positif (nombre entier exclu).",
          'no': "Kan bare inneholde en positiv flyttalsverdi (heltall ekskludert).",
          'ru': "Может содержать только положительное дробное или целое число."
        }
      },
      {
        'validator': 'floatSigned',
        'aliases': ['float_signed'],
        'invalid_data': ['12', '12.', 'abc', '12,3'],
        'valid_data': ['.5', '0.5', '12.3', '-12.3', '+12.3'],
        'error_message': {
          'en': "May only contain a positive or negative float value (integer excluded).",
          'es': "Debe contener un número decimal positivo ó negativo (Los números enteros no son validos).",
          'fr': "Doit être obligatoirement un nombre flottant positif ou négatif (nombre entier exclu).",
          'no': "Kan bare inneholde en positiv eller negativ flyttalsverdi (heltall ekskludert).",
          'ru': "Может содержать только положительное или отрицательное дробное или целое число."
        }
      },
      {
        'validator': 'iban',
        'invalid_data': ['ABC1234567890', 'DEABCD12500105170648489890'],
        'valid_data': ['DE12500105170648489890', 'AB12500105170648489890'],
        'error_message': {
          'en': "Must be a valid IBAN.",
          'es': "Debe contener un IBAN valido.",
          'fr': "Doit être un IBAN valide.",
          'no': "Må være en gyldig IBAN.",
          'ru': "Должно быть действительным международным номером банковского счёта (IBAN)."
        }
      },
      {
        'validator': 'in',
        'aliases': ['inList', 'in_list'],
        'params': 'chocolate,apple pie,ice cream,sweet & sour,A+B',
        'invalid_data': ['choco', 'carrot', 'apple'],
        'valid_data': ['chocolate', 'ice cream','sweet & sour','A+B'],
        'error_message': {
          'en': "Must be a choice inside this list: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'es': "Debe ser una opción dentro de esta lista: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'fr': "Doit être un choix dans cette liste: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'no': "Må være et valg inne i denne listen: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'ru': "Должно бытьвыбор в этом списке: (chocolate,apple pie,ice cream,sweet & sour,A+B)."
        }
      },
      {
        'validator': 'int',
        'aliases': ['integer'],
        'invalid_data': ['12.5', '.5', 'abc', '12,4', '-12.3', '+12.3'],
        'valid_data': ['12', '100'],
        'error_message': {
          'en': "Must be a positive integer.",
          'es': "Debe contener un número entero positivo.",
          'fr': "Doit être un nombre entier positif.",
          'no': "Må være et positivt heltall.",
          'ru': "Должно быть положительным целым числом."
        }
      },
      {
        'validator': 'intSigned',
        'aliases': ['integerSigned', 'int_signed', 'integer_signed'],
        'invalid_data': ['12.5', '.5', 'abc', '12,4'],
        'valid_data': ['12', '100', '-12', '+12'],
        'error_message': {
          'en': "Must be a positive or negative integer.",
          'es': "Debe contener un número entero positivo ó negativo.",
          'fr': "Doit être un nombre entier positif ou négatif.",
          'no': "Må være et positivt eller negativt heltall.",
          'ru': "Должно быть положительным или отрицательным целым числом."
        }
      },
      {
        'validator': 'ipv4',
        'aliases': ['ip'],
        'invalid_data': ['192.0.0.256', '256.0.0.256', '192.0.0'],
        'valid_data': ['192.0.0.1', '127.0.0.1', '255.255.255.0'],
        'error_message': {
          'en': "Must be a valid IP (IPV4).",
          'es': "Debe contener una dirección IP valida (IPV4).",
          'fr': "Doit être un IP valide (IPV4).",
          'no': "Må være en gyldig IP-adresse (IPV4).",
          'ru': "Должно быть действительным ip адресом (IPV4)."
        }
      },
      {
        'validator': 'ipv6',
        'invalid_data': ['127.0.0.1', '255.255.255.0', '1762:0:0:0:0:B03:1'],
        'valid_data': ['2002:4559:1FE2::4559:1FE2', '2002:4559:1FE2:0:0:0:4559:1FE2', '2002:4559:1FE2:0000:0000:0000:4559:1FE2'],
        'error_message': {
          'en': "Must be a valid IP (IPV6).",
          'es': "Debe contener una dirección IP valida (IPV6).",
          'fr': "Doit être un IP valide (IPV6).",
          'no': "Må være en gyldig IP-adresse (IPV6).",
          'ru': "Должно быть действительным ip адресом (IPV6)."
        }
      },
      {
        'validator': 'maxLen',
        'aliases': ['max_len'],
        'params': '11',
        'invalid_data': ['abcdefghijkl', 'abcdefghijklmnopqrstuvwxyz'],
        'valid_data': ['abcdefghij$', 'abcdef!@#$', 'abcdefghijk', '12345\r67890'],
        'error_message': {
          'en': "May not be greater than 11 characters.",
          'es': "No puede contener mas de 11 caracteres.",
          'fr': "Doit être plus petit que 11 caractères.",
          'no': "Kan ikke være større enn 11 characters.",
          'ru': "Должно быть размером не большим, чем 11 символов."
        }
      },
      {
        'validator': 'maxNum',
        'aliases': ['max_num'],
        'params': '99',
        'invalid_data': ['100', '255'],
        'valid_data': ['99', '1', '-1'],
        'error_message': {
          'en': "Needs to be a numeric value, equal to, or lower than 99.",
          'es': "Debe contener un valor númerico igual o menor que 99.",
          'fr': "Doit être une valeur numérique, égale ou inférieure à 99.",
          'no': "Må være en numerisk verdi, lik, eller mindre enn 99.",
          'ru': "Должно быть числовым значением, равное или меньшее чем 99."
        }
      },
      {
        'validator': 'minLen',
        'aliases': ['min_len'],
        'params': '3',
        'invalid_data': ['@@', 'ab'],
        'valid_data': ['!#$', 'abc', 'word', '1\r23'],
        'error_message': {
          'en': "Must be at least 3 characters.",
          'es': "Debe contener almenos 3 caracteres.",
          'fr': "Doit avoir au moins 3 caractères.",
          'no': "Må være minst 3 tegn.",
          'ru': "Должно быть размером не меньшим, чем 3 символов."
        }
      },
      {
        'validator': 'minNum',
        'aliases': ['min_num'],
        'params': '1',
        'invalid_data': ['0', '-1'],
        'valid_data': ['1', '+1', '120'],
        'error_message': {
          'en': "Needs to be a numeric value, equal to, or higher than 1.",
          'es': "Debe contener un valor númerico igual o mayor que 1.",
          'fr': "Doit être une valeur numérique, égale ou supérieure à 1.",
          'no': "Må være en numerisk verdi, lik, eller større enn 1.",
          'ru': "Должно быть числовым значением, равное или большее чем 1."
        }
      },
      {
        'validator': 'notIn',
        'aliases': ['not_in', 'notInList', 'not_in_list'],
        'params': 'chocolate,apple pie,ice cream,sweet & sour,A+B',
        'invalid_data': ['chocolate', 'apple pie', 'sweet & sour', 'A+B'],
        'valid_data': ['apple', 'sweet & sou', 'A+', 'B+A'],
        'error_message': {
          'en': "Must be a choice outside this list: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'es': "Debe ser una elección fuera de esta lista: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'fr': "Doit être un choix en dehors de cette liste: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'no': "Må være et valg utenfor denne listen: (chocolate,apple pie,ice cream,sweet & sour,A+B).",
          'ru': "Должно бытьвыбор за этот список: (chocolate,apple pie,ice cream,sweet & sour,A+B)."
        }
      },
      {
        'validator': 'numeric',
        'invalid_data': ['abc', '+2', '-2', '12,5'],
        'valid_data': ['0', '12.5'],
        'error_message': {
          'en': "Must be a positive number.",
          'es': "Debe contener un valor númerico positivo.",
          'fr': "Doit être un nombre positif.",
          'no': "Må være et positivt tall.",
          'ru': "Должно быть положительным числом."
        }
      },
      {
        'validator': 'numericSigned',
        'aliases': ['numeric_signed'],
        'invalid_data': ['abc', '12,5'],
        'valid_data': ['0', '12.5', '+2.2', '-2'],
        'error_message': {
          'en': "Must be a positive or negative number.",
          'es': "Debe contener un valor númerico positivo ó negativo.",
          'fr': "Doit être un nombre positif ou négatif.",
          'no': "Må være et positivt eller negativt tall.",
          'ru': "Должно быть положительным или отрицательным числом."
        }
      },
      {
        'validator': 'phone',
        'invalid_data': ['1-800-123-456', '123-456-789', '1234567890'],
        'valid_data': ['1-800-123-4567', '123-456-7890', '(123) 456-7890'],
        'error_message': {
          'en': "Must be a valid phone number and must include area code.",
          'es': "Debe ser un número de teléfono válido y debe incluir el código de área.",
          'fr': "Doit être un numéro de téléphone valide et doit inclure le code régional.",
          'no': "Må være et gyldig telefonnummer og inkluderer retningsnummer.",
          'ru': "Должен быть действительный телефонный номер и включают в себя код города."
        }
      },
      {
        'validator': 'url',
        'invalid_data': ['htp://www.future.com', 'fp://www.future.com', 'http:www.future.com'],
        'valid_data': ['http://www.future.com', 'https://future.com', 'ftp://www.future.com'],
        'error_message': {
          'en': "Must be a valid URL.",
          'es': "Debe contener una dirección URL valida.",
          'fr': "Doit être un URL valide.",
          'no': "Må være en gyldig URL.",
          'ru': "Должно быть действительным URL адресом."
        }
      },
      {
        'validator': 'time',
        'invalid_data': ['1010', '61:61', '00:00', '59:59:59'],
        'valid_data': ['10:10', '00:01', '23:59:59'],
        'error_message': {
          'en': "Must be a valid time format (hh:mm) OR (hh:mm:ss).",
          'es': "Debe contener un formato de tiempo valido (hh:mm) ó (hh:mm:ss).",
          'fr': "Doit être un format de temps valide (hh:mm) OU (hh:mm:ss).",
          'no': "Må være et gyldig tidsformat (tt:mm) OR (tt:mm:ss).",
          'ru': "Должно быть допустимым форматом времени (hh:mm) или (hh:mm:ss)."
        }
      }
    ];
}