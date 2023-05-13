const fromSymbol = args[0]
const toSymbol = args[1]

const url = 'https://min-api.cryptocompare.com/data/pricemultifull'

const cryptoCompareRequest = Functions.makeHttpRequest({
  url: url,
  params: {
    fsyms: fromSymbol,
    tsyms: toSymbol,
  },
})

const cryptoCompareResponse = await cryptoCompareRequest
if (cryptoCompareResponse.error) {
  console.error(cryptoCompareResponse.error)
  throw Error('Request failed')
}

const data = cryptoCompareResponse['data']
if (data.Response === 'Error') {
  console.error(data.Message)
  throw Error('Functional error. Read message: ' + data.Message)
}

const price = data['RAW'][fromSymbol][toSymbol]['PRICE']

return Functions.encodeUint256(Math.round(price * 100))
