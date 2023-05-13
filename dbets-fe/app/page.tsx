'use client'
import React, { use } from 'react'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { JsonRpcSigner } from '@ethersproject/providers'
import ConsumerContractABI from '../don-request/FunctionsConsumer.json'

const source = `const fromSymbol = args[0]
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
`

export default function Home() {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined)
  const [address, setAddress] = useState('Not Connected')

  const consumerAddress = '0x37ae5f238366b74ea6EC8936C5173D707840eDFA'

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
      const signer = provider.getSigner()
      signer
        .getAddress()
        .then(async (res) => {
          setAddress(res)
          console.log('signer', signer)
          const balance = await signer.getBalance()
          console.log('balance', balance)
          setSigner(signer)
        })
        .catch((err) => {
          console.log('oops' + err)
        })
    }
  }, [])

  async function requestTest() {
    if (signer !== undefined && address !== 'Not Connected') {
      const consumerContract = new ethers.Contract(
        consumerAddress,
        ConsumerContractABI.abi,
        signer
      )

      // const result = await consumerContract.executeRequest(
      //   source,
      //   encryptedSecrets ?? '0x',
      //   args ?? [],
      //   subscriptionId,
      //   gasLimit, // Set the desired gas limit value
      //   {
      //     gasLimit: requestGas, // Set the gas limit for the Chainlink Functions request
      //   }
      // );

      const transaction = await consumerContract.executeRequest(
        source,
        '0x',
        ['ETH', 'USD'], // Chainlink Functions request args
        921, // Subscription ID
        250000, // Gas limit for the transaction
        {
          gasLimit: 500000, // Gas limit for the Chainlink Functions request
        }
      )

      const receipt = await transaction.wait()

      console.log('Transaction mined:', receipt)
    } else {
      console.log('Signer not defined')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-20 ">
      <h1 className="text-8xl font-bold">Welcome to dBets!</h1>

      <div>
        <button
          className="p-4 bg-white text-neutral-950 rounded-full"
          onClick={requestTest}
        >
          Computation test
        </button>
      </div>

      <p> Address {address}</p>

      <p>10/10 Gud design -Kseniovska</p>
    </main>
  )
}
