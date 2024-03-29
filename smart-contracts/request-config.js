const fs = require('fs');
const path = require('path');

require('@chainlink/env-enc').config();

const Location = {
  Inline: 0,
  Remote: 1
};

const CodeLanguage = {
  JavaScript: 0
};

const ReturnType = {
  uint: 'uint256',
  uint256: 'uint256',
  int: 'int256',
  int256: 'int256',
  string: 'string',
  bytes: 'Buffer',
  Buffer: 'Buffer'
};

// Configure the request by setting the fields below
const requestConfig = {
  // Location of source code (only Inline is currently supported)
  codeLocation: Location.Inline,
  // Code language (only JavaScript is currently supported)
  codeLanguage: CodeLanguage.JavaScript,
  // String containing the source code to be executed
  source: fs.readFileSync(path.resolve(__dirname, 'source.js')).toString(),
  //source: fs.readFileSync('./API-request-example.js').toString(),
  // Secrets can be accessed within the source code with `secrets.varName` (ie: secrets.apiKey). The secrets object can only contain string values.
  secrets: { apiKey: process.env.COINMARKETCAP_API_KEY },
  // ETH wallet key used to sign secrets so they cannot be accessed by a 3rd party
  walletPrivateKey: process.env['PRIVATE_KEY'],
  // Args (string only array) can be accessed within the source code with `args[index]` (ie: args[0]).
  args: ['1', 'bitcoin', 'btc-bitcoin'],
  // Expected type of the returned value
  expectedReturnType: ReturnType.uint256,
  // Redundant URLs which point to encrypted off-chain secrets
  secretsURLs: [
    'https://chainlink-spring-2023-secrets.s3.eu-central-1.amazonaws.com/offchain-secrets.json'
  ]
};

module.exports = requestConfig;
