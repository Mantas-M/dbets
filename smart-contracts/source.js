const crypto = args[0];
const ticker = args[1];
const name = args[2];
const pricePrediction = args[3];
const dateForPrediction = args[4];
const imageLink = args[5];

if (
  secrets.apiKey == '' ||
  secrets.apiKey ===
    'Your coinmarketcap API key (get a free one: https://coinmarketcap.com/api/)'
) {
  throw Error(
    'COINMARKETCAP_API_KEY environment variable not set for CoinMarketCap API.  Get a free key from https://coinmarketcap.com/api/'
  );
}

const coinMarketCapRequest = Functions.makeHttpRequest({
  url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
  headers: { 'X-CMC_PRO_API_KEY': secrets.apiKey },
  params: {
    convert: 'USD',
    id: coinMarketCapCoinId
  }
});

const coinGeckoRequest = Functions.makeHttpRequest({
  url: 'https://api.coingecko.com/api/v3/simple/price',
  params: {
    ids: coinGeckoCoinId,
    vs_currencies: 'usd'
  }
});

const coinPaprikaRequest = Functions.makeHttpRequest({
  url: 'https://api.coinpaprika.com/v1/tickers/' + coinPaprikaCoinId
});

const [coinMarketCapResponse, coinGeckoResponse, coinPaprikaResponse] =
  await Promise.all([
    coinMarketCapRequest,
    coinGeckoRequest,
    coinPaprikaRequest
  ]);

const prices = [];

if (!coinMarketCapResponse.error) {
  prices.push(
    coinMarketCapResponse.data.data[coinMarketCapCoinId].quote.USD.price
  );
} else {
  console.log('CoinMarketCap Error');
}

if (!coinGeckoResponse.error) {
  prices.push(coinGeckoResponse.data[coinGeckoCoinId].usd);
} else {
  console.log('CoinGecko Error');
}
if (!coinPaprikaResponse.error) {
  prices.push(coinPaprikaResponse.data.quotes.USD.price);
} else {
  console.log('CoinPaprika Error');
}

if (prices.length < 2) {
  throw Error('More than 1 API failed');
}

const medianPrice = prices.sort((a, b) => a - b)[Math.round(prices.length / 2)];
console.log('Median Bitcoin price: $' + medianPrice.toFixed(2));

return Functions.encodeUint256(Math.round(medianPrice * 100));
