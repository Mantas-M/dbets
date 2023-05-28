import axios from 'axios';

const getTokenUri = async () => {
  const requestData = {
    crypto: 'ethereum',
    ticker: 'ETH',
    name: '@MantasM',
    pricePrediction: '1000',
    dateForPrediction: Date.now()
  };

  const response = await axios.get(
    'http://localhost:3000/dev/generate-image-url',
    {
      params: {
        crypto: requestData.crypto,
        ticker: requestData.ticker
      }
    }
  );

  const imageUrl = response.data;

  const response2 = await axios.get(
    'http://localhost:3000/dev/pin-image-to-pinata',
    {
      params: {
        sourceUrl: imageUrl
      }
    }
  );

  const imageUri = response2.data;

  const response3 = await axios.get(
    'http://localhost:3000/dev/generate-metadata-json',
    {
      params: {
        ticker: requestData.ticker,
        name: requestData.name,
        pricePrediction: requestData.pricePrediction,
        dateForPrediction: requestData.dateForPrediction,
        crypto: requestData.crypto,
        imageLink: imageUri
      }
    }
  );

  const metadata = response3.data;

  const response4 = await axios.post(
    'http://localhost:3000/dev/pin-metadata-to-pinata',
    { metadata },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const tokenUri = response4.data;

  console.log(tokenUri);
};

await getTokenUri();
