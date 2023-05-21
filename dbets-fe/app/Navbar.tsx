'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function Navbar() {
  const [address, setAddress] = useState('Not Connected');
  const [network, setNetwork] = useState('');
  const [connected, setConnected] = useState(false);

  const bgConnectButton = connected ? 'bg-green-600' : 'bg-black';

  useEffect(() => {
    // Check if MetaMask is installed

    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed.');
    } else {
      console.log('MetaMask is installed.');
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(async (res) => {
          setConnected(true);
          console.log('Accounts ' + res);
          setAddress(res[0].slice(0, 6) + '...' + res[0].slice(-4));

          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          if (chainId === '0x13881') {
            setNetwork('Mumbai');
          } else {
            setNetwork('Unsupported Network');
          }
        })
        .catch((err) => {
          console.log('oops' + err);
        });
    }
  }, []);

  window.ethereum.on('chainChanged', handleChainChanged);

  function handleChainChanged(chainId) {
    // We recommend reloading the page, unless you must do otherwise.
    // window.location.reload()
    if (chainId === 0x13881) {
      setNetwork('Mumbai');
    } else {
      setNetwork('Unsupported Network');
    }

    // setNetwork(chainId)
  }

  async function requestMetamaskConnection() {
    // Check if MetaMask is installed and available
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request the user's permission to connect
        const provider = new ethers.providers.Web3Provider(
          window.ethereum,
          'any'
        );
        // Prompt user for account connections
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const accountAdress = (await signer.getAddress()).toLowerCase();
        console.log('Account:', accountAdress);

        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });
        if (chainId === '0x13881') {
          setNetwork('Mumbai');
        } else {
          setNetwork('Unsupported Network');
        }

        setAddress(accountAdress.slice(0, 6) + '...' + accountAdress.slice(-4));
        setConnected(true);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      console.error(
        'MetaMask not detected. Please install MetaMask to connect.'
      );
    }
  }

  return (
    <nav className="flex items-center justify-center flex-wrap bg-blue-900 p-6">
      <div className="flex items-center flex-shrink-0 text-white mr-6">
        <span className="font-semibold text-2xl tracking-tight">dBets</span>
      </div>
      <div className=" flex-grow flex items-center w-auto justify-center">
        <div className=" flex">
          <a
            href="#responsive-header"
            className="flex text-sm mr-3 px-4 py-2 leading-none border rounded text-white border-white bg-black hover:border-black hover:text-black hover:bg-white"
          >
            Mint Prediction
          </a>

          <a
            href="#responsive-header"
            className="flex text-sm px-4 py-2 leading-none border rounded text-white border-white bg-black hover:border-black hover:text-black hover:bg-white"
          >
            Create Bet
          </a>
        </div>

        <div className="flex ml-auto pr-3"> {address}</div>
        <div className="flex pr-3"> {network}</div>

        <div className="">
          <button
            type="button"
            className={`flex text-sm px-4 py-2 leading-none border rounded text-white border-white bg-green ${bgConnectButton} hover:border-black hover:text-black hover:bg-white`}
            onClick={requestMetamaskConnection}
          >
            {connected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </nav>
  );
}
