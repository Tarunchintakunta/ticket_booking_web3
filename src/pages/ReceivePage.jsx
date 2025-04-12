// src/pages/ReceivePage.jsx
import React, { useContext, useState } from 'react';
import QRCode from 'qrcode.react';
import { ethers } from 'ethers';
import Web3Context from '../contexts/Web3Context';

const ReceivePage = () => {
  const { account, balance } = useContext(Web3Context);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Generate ETH payment URI with optional amount and message
  const generatePaymentURI = () => {
    let uri = `ethereum:${account}`;
    
    // Add amount if specified
    if (amount) {
      try {
        const parsedAmount = ethers.parseEther(amount);
        uri += `?value=${parsedAmount.toString()}`;
      } catch (error) {
        console.error("Invalid ETH amount:", error);
      }
    }
    
    // Add message if specified
    if (note && amount) {
      uri += `&message=${encodeURIComponent(note)}`;
    } else if (note) {
      uri += `?message=${encodeURIComponent(note)}`;
    }
    
    return uri;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Receive ETH</h1>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            {/* QR Code Section - Left Column */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary to-blue-700 text-white p-8 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
                <QRCode 
                  value={generatePaymentURI()}
                  size={180}
                  level={"H"}
                  includeMargin={true}
                  renderAs="svg"
                />
              </div>
              <p className="text-sm text-white text-center opacity-90">Scan to pay with any ETH wallet</p>
              
              {/* Balance display on mobile */}
              <div className="md:hidden mt-6 w-full">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-sm text-white/80">Current Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Details Section - Right Column */}
            <div className="md:col-span-3 p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Wallet</h2>
              
              <div className="space-y-6">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    ETH Address
                  </label>
                  <div className="flex">
                    <div className="bg-gray-50 border border-gray-200 rounded-l-lg px-3 py-3 font-mono text-sm flex-grow overflow-x-auto whitespace-nowrap text-gray-800">
                      {account}
                    </div>
                    <button 
                      onClick={handleCopyAddress}
                      className={`${
                        copied ? 'bg-green-500' : 'bg-primary'
                      } text-white px-4 py-3 rounded-r-lg hover:opacity-90 transition-colors flex items-center justify-center min-w-[90px]`}
                    >
                      {copied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Copied
                        </>
                      ) : 'Copy'}
                    </button>
                  </div>
                </div>
                
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Amount (ETH) - Optional
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      step="0.001"
                      min="0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium">ETH</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Specify an amount to request
                  </p>
                </div>
                
                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Note - Optional
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's this payment for?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                {/* Balance - Hidden on mobile, shown on desktop */}
                <div className="hidden md:block">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Current Balance
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-800">
                      {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Network Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-blue-700 font-medium mb-1">Network Information</h3>
            <p className="text-blue-600 text-sm">
              You are currently on the Sepolia Test Network. Make sure the sender is also using the Sepolia Test Network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivePage;