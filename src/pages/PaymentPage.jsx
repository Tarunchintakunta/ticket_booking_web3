// src/pages/PaymentPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import Web3Context from '../contexts/Web3Context';

// Format timestamp to readable date
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const PaymentPage = () => {
  const { matchId, quantity } = useParams();
  const { contract, account, isConnected, connectWallet } = React.useContext(Web3Context);
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [error, setError] = useState(null);

  // Fetch match details
  useEffect(() => {
    // Skip if already attempted or missing dependencies
    if (hasAttemptedFetch || !contract || !isConnected || !matchId) return;

    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasAttemptedFetch(true);
        
        console.log(`Payment: Fetching details for match ID: ${matchId}`);
        
        const details = await contract.getMatchDetails(matchId);
        console.log("Match details received:", details);
        
        setMatch({
          id: matchId,
          sport: details.sport,
          homeTeam: details.homeTeam,
          awayTeam: details.awayTeam,
          venue: details.venue,
          date: details.date.toString(),
          ticketPrice: details.ticketPrice,
          formattedPrice: ethers.formatEther(details.ticketPrice),
          availableTickets: details.availableTickets.toString(),
        });
      } catch (error) {
        console.error('Error fetching match details:', error);
        setError('Failed to load match details. Please try again.');
        // Don't navigate away automatically - let the user decide
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [contract, matchId, isConnected, hasAttemptedFetch]);

  // Calculate total price - memoized
  const totalPrice = useMemo(() => {
    if (!match || !quantity) return 0;
    return parseFloat(match.formattedPrice) * parseInt(quantity);
  }, [match, quantity]);

  // Handle wallet connection - memoized
  const handleConnect = useCallback(async () => {
    await connectWallet();
  }, [connectWallet]);

  // Purchase tickets - memoized
  const handlePurchase = useCallback(async () => {
    if (!contract || !account || !match) return;

    try {
      setPurchasing(true);
      
      // Calculate total price in wei
      const totalPriceWei = ethers.parseEther(totalPrice.toString());
      
      // Purchase tickets
      console.log(`Purchasing ${quantity} tickets for match ${matchId}`);
      console.log(`Total price: ${totalPrice} ETH (${totalPriceWei} wei)`);
      
      // Toast notification
      toast.loading('Processing transaction...', { id: 'transaction' });
      
      // Purchase tickets
      const transaction = await contract.purchaseTicket(
        matchId,
        quantity,
        { value: totalPriceWei }
      );
      
      console.log("Transaction sent:", transaction);
      
      // Wait for transaction to be mined
      const receipt = await transaction.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Set transaction hash
      setTransactionHash(receipt.hash || receipt.transactionHash);
      
      // Toast success
      toast.success('Tickets purchased successfully!', { id: 'transaction' });
      
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      toast.error(`Transaction failed: ${error.message || 'Unknown error'}`, { id: 'transaction' });
    } finally {
      setPurchasing(false);
    }
  }, [contract, account, match, matchId, quantity, totalPrice]);

  // Handle back button - memoized
  const handleBack = useCallback(() => {
    navigate(`/book/${matchId}`);
  }, [navigate, matchId]);

  // Handle go to dashboard - memoized
  const handleViewTickets = useCallback(() => {
    navigate('/my-tickets');
  }, [navigate]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
          <button onClick={handleConnect} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button onClick={handleBack} className="btn-primary">
            Back to Booking Page
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Match not found</h2>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center mb-6">
          <button 
            onClick={handleBack}
            className="mr-3 text-primary hover:text-blue-700"
            disabled={purchasing || transactionHash}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Payment</h1>
        </div>

        {transactionHash ? (
          <div className="card">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-8">Your tickets have been purchased successfully</p>
              
              <div className="mb-8">
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600 break-all">
                  Transaction: <a 
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {transactionHash}
                  </a>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleViewTickets}
                  className="btn-primary"
                >
                  View My Tickets
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Order Summary
            </h2>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-medium text-gray-800">{match.homeTeam} vs {match.awayTeam}</h3>
                  <p className="text-sm text-gray-600">{match.venue}</p>
                  <p className="text-sm text-gray-600">{formatDate(match.date)}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-gray-800">{quantity} {parseInt(quantity) === 1 ? 'ticket' : 'tickets'}</p>
                  <p className="text-sm text-gray-600">{match.formattedPrice} ETH each</p>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-700">Total Price</h3>
                <div className="text-xl font-bold text-primary">{totalPrice.toFixed(6)} ETH</div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                (Plus gas fees)
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Payment Method</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">MetaMask (Sepolia Testnet)</p>
                  <p className="text-sm text-gray-600">{account}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handlePurchase}
              className="btn-primary w-full py-3 text-lg"
              disabled={purchasing}
            >
              {purchasing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Confirm Payment'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PaymentPage);