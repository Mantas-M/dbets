import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const response = await axios.get(
  'https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100&pageOffset=0',
  {
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`
    }
  }
);

const pins = response.data;
const pinIds = pins.rows.map((pin) => pin.ipfs_pin_hash);

console.log(pins);

for (const pinId of pinIds) {
  const res = await axios.delete(
    `https://api.pinata.cloud/pinning/unpin/${pinId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`
      }
    }
  );

  console.log(res.data);
}
