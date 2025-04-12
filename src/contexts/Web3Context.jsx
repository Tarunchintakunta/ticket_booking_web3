// src/contexts/Web3Context.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import TicketBookingABI from '../contracts/TicketBookingABI.json';

export const Web3Context = createContext();

// Contract address
const CONTRACT_ADDRESS = "0x94f965cef02c093761DE88E0DE181D2482254fAc";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // Chain ID for Sepolia testnet

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [signer, setSigner] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Check if the wallet is connected to the correct network (Sepolia)
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Current chainId:", chainId);
      const isCorrect = chainId === SEPOLIA_CHAIN_ID;
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  }, []);

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (error) {
      console.error("Error switching network:", error);
      
      // If the chain is not added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding network:", addError);
          return false;
        }
      }
      return false;
    }
  };

  // Update account details
  const updateAccountDetails = useCallback(async () => {
    if (!provider || !account) return;
    
    try {
      // In ethers v6, getBalance returns a bigint
      const balance = await provider.getBalance(account);
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error updating account details:", error);
    }
  }, [provider, account]);

  // Connect wallet handler
  const connectWallet = async () => {
    setConnectionError(null);
    
    if (!window.ethereum) {
      setConnectionError("Please install MetaMask to use this application.");
      alert("Please install MetaMask to use this application.");
      return false;
    }

    try {
      console.log("Connecting wallet...");
      
      // Check network
      const isCorrect = await checkNetwork();
      if (!isCorrect) {
        console.log("Incorrect network, switching to Sepolia...");
        const switched = await switchToSepolia();
        if (!switched) {
          setConnectionError("Failed to switch to Sepolia network.");
          return false;
        }
      }

      // Request account access
      console.log("Requesting accounts...");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Accounts:", accounts);
      
      if (accounts.length === 0) {
        setConnectionError("No accounts found. Please unlock your MetaMask wallet.");
        return false;
      }
      
      // v6 syntax for creating provider and signer
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      
      console.log("Creating contract instance...");
      console.log("Contract Address:", CONTRACT_ADDRESS);
      console.log("ABI Type:", typeof TicketBookingABI);
      console.log("ABI is array:", Array.isArray(TicketBookingABI));
      
      // Make sure ABI is properly loaded and is an array
      if (!Array.isArray(TicketBookingABI)) {
        setConnectionError("Invalid ABI format. Please check the ABI file.");
        return false;
      }
      
      try {
        // v6 contract creation
        const newContract = new ethers.Contract(CONTRACT_ADDRESS, TicketBookingABI, newSigner);
        
        setAccount(accounts[0]);
        setProvider(newProvider);
        setSigner(newSigner);
        setContract(newContract);
        setIsConnected(true);
        
        await updateAccountDetails();
        return true;
      } catch (contractError) {
        console.error("Error creating contract instance:", contractError);
        setConnectionError(`Failed to create contract instance: ${contractError.message}`);
        return false;
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setConnectionError(`Failed to connect wallet: ${error.message}`);
      return false;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    console.log("Disconnecting wallet...");
    setAccount(null);
    setBalance(null);
    setContract(null);
    setSigner(null);
    setIsConnected(false);
    setConnectionError(null);
  };

  // Setup event listeners for MetaMask
  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      const handleAccountsChanged = (accounts) => {
        console.log("Accounts changed:", accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          updateAccountDetails();
        }
      };

      // Handle chain changes
      const handleChainChanged = () => {
        console.log("Chain changed");
        checkNetwork();
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      };

      checkConnection();

      // Cleanup event listeners
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [checkNetwork, updateAccountDetails]);

  // Update account details when account or provider changes
  useEffect(() => {
    if (account && provider) {
      updateAccountDetails();
    }
  }, [account, provider, updateAccountDetails]);

  // Context values
  const value = {
    account,
    balance,
    contract,
    provider,
    signer,
    isConnected,
    isCorrectNetwork,
    connectionError,
    connectWallet,
    disconnectWallet,
    updateAccountDetails,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Context;