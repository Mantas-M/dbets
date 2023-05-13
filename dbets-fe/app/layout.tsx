import Navbar from './Navbar'
import './globals.css'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider
  }
}

export const metadata = {
  title: 'dBets',
  description: 'Mint price prediction NFTs and bet against your friends!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <Navbar />
        </header>
        {children}
      </body>
    </html>
  )
}
