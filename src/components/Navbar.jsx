// src/components/Navbar.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Web3Context from '../contexts/Web3Context';

const Navbar = () => {
  const { account, balance, isConnected, connectWallet, disconnectWallet } = useContext(Web3Context);
  const navigate = useNavigate();

  // Format account address to show only first and last few characters
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleDisconnect = () => {
    console.log("Disconnecting wallet...");
    disconnectWallet();
    // Navigate back to landing page on disconnect
    navigate('/');
  };

  const handleReceiveClick = () => {
    navigate('/receive');
  };

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-primary text-2xl font-bold">SportsTix</span>
        </Link>

        {/* Navigation links and wallet info */}
        <div className="flex items-center space-x-6">
          {isConnected && (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-primary">
                Dashboard
              </Link>
              <Link to="/my-tickets" className="text-gray-700 hover:text-primary">
                My Tickets
              </Link>
              <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-2">
                <div className="flex flex-col">
                  <span className="text-gray-600 text-xs">Balance</span>
                  <span className="font-semibold text-gray-800">{balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH'}</span>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex flex-col">
                  <span className="text-gray-600 text-xs">Address</span>
                  <span className="font-mono text-gray-800">{formatAddress(account)}</span>
                </div>
                <button
                  onClick={handleReceiveClick}
                  className="ml-2 bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm"
                >
                  Receive
                </button>
              </div>
              <button
                onClick={handleDisconnect}
                className="border border-red-500 text-red-500 px-4 py-1 rounded-md hover:bg-red-50"
              >
                Disconnect
              </button>
            </>
          )}
          
          {!isConnected && (
            <button
              onClick={connectWallet}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;