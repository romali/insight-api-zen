'use strict';

var request = require('request');

function CurrencyController(options) {
  this.node = options.node;
  var refresh = options.currencyRefresh || CurrencyController.DEFAULT_CURRENCY_DELAY;
  this.currencyDelay = refresh * 60000;
  this.bitstampRate = 0; // USD/BTC
  this.bittrexRate = 0; // BTC/ZEN
  this.timestamp = Date.now();
}

CurrencyController.DEFAULT_CURRENCY_DELAY = 10;

CurrencyController.prototype.index = function(req, res) {
  var self = this;
  var unit = 'USD'; // req.query.q; //req.query.q to be used when also modifying insight-ui-zen to include other currencies
  var currentTime = Date.now();
  if (self.bitstampRate === 0 || currentTime >= (self.timestamp + self.currencyDelay)) {
    self.timestamp = currentTime;
    request('https://blockchain.info/ticker', function(err, response, body) {
      if (err) {
        self.node.log.error(err);
      }
      if (!err && response.statusCode === 200) {
        self.bitstampRate = JSON.parse(body);
      }
      request('https://bittrex.com/api/v1.1/public/getticker?market=btc-zen', function(err, response, body) {
        if (err) {
          self.node.log.error(err);
        }
        if (!err && response.statusCode === 200) {
          if (parseFloat(JSON.parse(body).result.Last) != null) {
            self.bittrexRate = parseFloat(JSON.parse(body).result.Last);
          }
        }
        res.jsonp({
          status: 200,
          data: {
            bitstamp: self.bitstampRate[unit].last * self.bittrexRate
          }
        });
      });
    });
  } else {
    res.jsonp({
      status: 200,
      data: { 
        bitstamp: self.bitstampRate[unit].last * self.bittrexRate
      }
    });
  }

};

module.exports = CurrencyController;
