import { Configuration, OpenAIApi } from 'openai';
import express from 'express';
import sls from 'serverless-http';
import * as dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import axiosRetry from 'axios-retry';
dotenv.config();

const app = express();

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

const generateImage = async (ticker) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  });

  const openai = new OpenAIApi(configuration);
  try {
    console.log('Creating image...');
    const completion = await openai.createImage({
      prompt: `negative ${ticker} crypto price prediction`,
      n: 1,
      size: '1024x1024'
    });
    const imageUrl = completion.data.data[0].url;
    console.log('Image created!');
    return imageUrl;
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
  imageLink
) => {
  const todaysDate = new Date().toISOString().slice(0, 10);
  const attributes = [
    { trait_type: 'Ticker', value: ticker },
    { trait_type: 'Name', value: name },
    { trait_type: 'Price prediction', value: pricePrediction },
    { trait_type: 'Date of prediction', value: dateForPrediction },
    { trait_type: 'Date of mint', value: todaysDate }
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

app.get('/generate-metadata-url', async (req, res) => {
  const { ticker, name, pricePrediction, dateForPrediction } = req.query;

  if (!ticker || !pricePrediction || !dateForPrediction) {
    console.log(
      `Missing required params ${ticker}, ${pricePrediction}, ${dateForPrediction}`
    );
    return res.status(400).send('Missing required params');
  }

  const tempImageLink = await generateImage();
  const imageLink = await uploadImageToPinata(tempImageLink);

  const metadata = generateMetadata(
    ticker,
    name,
    pricePrediction,
    dateForPrediction,
    imageLink
  );

  const metadataUrl = await pinMetadataToPinata(metadata);

  res.send(metadataUrl);
});

export const handler = sls(app);
