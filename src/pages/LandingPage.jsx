// src/pages/LandingPage.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Web3Context from '../contexts/Web3Context';

const LandingPage = () => {
  const { isConnected, connectWallet, connectionError } = useContext(Web3Context);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  const handleConnectWallet = async () => {
    setIsLoading(true);
    const success = await connectWallet();
    setIsLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center items-center px-4">
      <div className="text-center max-w-3xl mx-auto mb-12">
        {/* Logo or icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-primary rounded-lg flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Decentralized Sports Tickets</h1>
        
        {/* Subheading */}
        <p className="text-xl text-gray-600 mb-8">
          Book tickets for your favorite sports events securely on the blockchain
        </p>
        
        {/* Connect wallet button */}
        <button
          onClick={handleConnectWallet}
          disabled={isLoading}
          className="bg-primary text-white text-lg px-8 py-3 rounded-md hover:bg-blue-600 transition-colors duration-300 shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Connecting...
            </div>
          ) : (
            'Connect Wallet to Start'
          )}
        </button>

        {/* Error message */}
        {connectionError && (
          <p className="mt-4 text-red-500">{connectionError}</p>
        )}
      </div>
      
      {/* Additional information (optional) */}
      <div className="mt-16 text-center text-gray-500">
        <p>Powered by Ethereum (Sepolia Testnet)</p>
        <p className="mt-2">No intermediaries. No hidden fees. Full transparency.</p>
      </div>
    </div>
  );
};

export default LandingPage;