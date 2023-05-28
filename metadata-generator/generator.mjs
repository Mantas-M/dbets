import { Configuration, OpenAIApi } from 'openai';
import express from 'express';
import sls from 'serverless-http';
import * as dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import axiosRetry from 'axios-retry';
import bodyParser from 'body-parser';
dotenv.config();

const app = express();
app.use(bodyParser.json());

const pinMetadataToPinata = async (jsonObject) => {
  try {
    console.log('Pinning metadata to IPFS...');
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      jsonObject,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );

    if (response.status === 200) {
      console.log('File pinned successfully!');
      return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
    } else {
      console.log('Failed to pin the file.');
      throw new Error('Failed to pin the file.');
    }
  } catch (error) {
    console.error('Error pinning the file:', error.message);
    throw new Error('Error pinning the file:', error.message);
  }
};

const uploadImageToPinata = async (sourceUrl) => {
  const axiosInstance = axios.create();

  axiosRetry(axiosInstance, { retries: 5 });
  const data = new FormData();

  const response = await axiosInstance(sourceUrl, {
    method: 'GET',
    responseType: 'stream'
  });
  data.append(`file`, response.data);

  try {
    console.log('Uploading image to IPFS...');
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      data,
      {
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          Authorization: 'Bearer ' + process.env.PINATA_JWT
        }
      }
    );
    console.log('Image uploaded to IPFS!');

    return `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
  } catch (error) {
    throw new Error(`Error uploading image: ${error.message}`);
  }
};

const generateImage = async (ticker, crypto) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  });

  const openai = new OpenAIApi(configuration);
  try {
    // const completion = await openai.createImage({
    //   prompt: `positive ${crypto} crypto currency price chart`,
    //   n: 1,
    //   size: '256x256'
    // });
    // const imageUrl = completion.data.data[0].url;
    // return imageUrl;
    return 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Image_created_with_a_mobile_phone.png';
  } catch (error) {
    console.error(error);
    throw new Error(`Error creating image: ${error.message}`);
  }
};

const generateMetadata = (
  ticker,
  name,
  pricePrediction,
  dateForPrediction,
  imageLink,
  crypto
) => {
  const currentTimestamp = Date.now();
  const attributes = [
    { trait_type: 'Crypto', value: crypto },
    { trait_type: 'Ticker', value: ticker },
    { trait_type: 'User Name', value: name },
    { trait_type: 'Price prediction', value: pricePrediction },
    {
      display_type: 'date',
      trait_type: 'Prediction Maturity',
      value: +dateForPrediction
    },
    {
      display_type: 'date',
      trait_type: 'Date of mint',
      value: currentTimestamp
    }
  ];

  const metadata = {
    description:
      'Confidnent in your knowledge of the future? Of course you are! Make a prediction and flex on your friends!',
    external_url: 'https://github.com/Mantas-M/dbets',
    image: imageLink,
    name: `${ticker} price prediction${name ? ` by ${name}` : ''}`,
    attributes
  };

  console.log('Metadata generated!');

  return metadata;
};

app.get('/generate-image-url', async (req, res) => {
  const { ticker, crypto } = req.query;

  if (!ticker || !crypto) {
    console.log(`Missing required params ${ticker}, ${crypto}`);
    return res.status(400).send('Missing required params');
  }

  const imageUrl = await generateImage(ticker, crypto);

  res.send(imageUrl);
});

app.get('/pin-image-to-pinata', async (req, res) => {
  const { sourceUrl } = req.query;

  if (!sourceUrl) {
    console.log(`Missing required params ${sourceUrl}`);
    return res.status(400).send('Missing required params');
  }

  const imageUrl = await uploadImageToPinata(sourceUrl);

  res.send(imageUrl);
});

app.get('/generate-metadata-json', async (req, res) => {
  const {
    ticker,
    username,
    pricePrediction,
    predictionMaturity,
    crypto,
    imageLink
  } = req.query;

  if (!ticker || !pricePrediction || !predictionMaturity || !crypto) {
    console.log(
      `Missing required params ${ticker}, ${pricePrediction}, ${predictionMaturity}, ${crypto}`
    );
    return res.status(400).send('Missing required params');
  }

  const metadata = generateMetadata(
    ticker,
    username,
    pricePrediction,
    predictionMaturity,
    imageLink,
    crypto
  );

  res.json(metadata);
});

app.post('/pin-metadata-to-pinata', async (req, res) => {
  const { metadata } = req.body;

  if (!metadata) {
    console.log(`Missing required params ${metadata}`);
    return res.status(400).send('Missing required params');
  }

  const metadataUrl = await pinMetadataToPinata(metadata);

  res.send(metadataUrl);
});

export const handler = sls(app);
