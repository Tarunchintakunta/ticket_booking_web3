import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
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

const TicketBookingPage = () => {
  const { matchId } = useParams();
  const { contract, isConnected, connectWallet } = React.useContext(Web3Context);
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  // Add this ref to track component mounting and prevent re-fetching
  const mountedRef = useRef(false);

  // Fetch match details - only when dependencies actually change
  const fetchMatchDetails = useCallback(async () => {
    if (!contract || !matchId) return;
    
    try {
      console.log(`Fetching details for match ID: ${matchId}`);
      setLoading(true);
      
      const details = await contract.getMatchDetails(matchId);
      
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
      setFetchError(false);
    } catch (error) {
      console.error('Error fetching match details:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [contract, matchId]);

  // Fetch match data only when necessary
  useEffect(() => {
    if (isConnected && contract && !mountedRef.current) {
      mountedRef.current = true;
      fetchMatchDetails();
    }
  }, [isConnected, contract, fetchMatchDetails]);

  // Reset fetch state when matchId changes
  useEffect(() => {
    setHasAttemptedFetch(false);
    setMatch(null);
    setLoading(true);
    setFetchError(false);
    mountedRef.current = false; // Reset the ref when matchId changes
  }, [matchId]);

  // Memoize expensive calculations
  const totalPrice = useMemo(() => {
    return match ? parseFloat(match.formattedPrice) * quantity : 0;
  }, [match, quantity]);

  // Handlers
  const handleQuantityChange = useCallback((e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 10 && match && value <= parseInt(match.availableTickets)) {
      setQuantity(value);
    }
  }, [match]);

  const handleIncrement = useCallback(() => {
    if (quantity < 10 && match && quantity < parseInt(match.availableTickets)) {
      setQuantity(prev => prev + 1);
    }
  }, [quantity, match]);

  const handleDecrement = useCallback(() => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  }, [quantity]);

  const handleProceedToPayment = useCallback(() => {
    navigate(`/payment/${matchId}/${quantity}`);
  }, [navigate, matchId, quantity]);

  const handleConnect = useCallback(async () => {
    await connectWallet();
  }, [connectWallet]);

  // Connect wallet prompt
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

  // Loading state
  if (loading && !fetchError) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error or not found state
  if (!match || fetchError) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {fetchError ? "Error loading match data" : "Match not found"}
          </h2>
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
            onClick={() => navigate(`/sports/${match.sport.toLowerCase()}`)}
            className="mr-3 text-primary hover:text-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Book Tickets</h1>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {match.homeTeam} vs {match.awayTeam}
          </h2>
          
          {/* Match details section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Match Details column */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Match Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Sport</p>
                    <p className="text-gray-800">{match.sport}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="text-gray-800">{match.venue}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-gray-800">{formatDate(match.date)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ticket Information column */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Ticket Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Price per ticket</p>
                    <p className="text-gray-800">{match.formattedPrice} ETH</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Available tickets</p>
                    <p className="text-gray-800">{match.availableTickets}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quantity selection */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Select Quantity</h3>
            
            <div className="flex items-center mb-6">
              <button 
                onClick={handleDecrement}
                className="bg-gray-200 text-gray-600 hover:bg-gray-300 h-10 w-10 rounded-md flex items-center justify-center"
                disabled={quantity <= 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <input
                type="number"
                min="1"
                max={Math.min(10, match.availableTickets)}
                value={quantity}
                onChange={handleQuantityChange}
                className="mx-3 h-10 w-16 border-gray-300 rounded-md text-center"
              />
              
              <button 
                onClick={handleIncrement}
                className="bg-gray-200 text-gray-600 hover:bg-gray-300 h-10 w-10 rounded-md flex items-center justify-center"
                disabled={quantity >= 10 || quantity >= match.availableTickets}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="ml-6 text-gray-500">
                {quantity > 1 ? `${quantity} tickets` : '1 ticket'}
              </div>
            </div>
            
            {/* Total price and checkout button */}
            <div className="border-t border-gray-200 pt-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Total Price</h3>
                <div className="text-xl font-bold text-primary">{totalPrice.toFixed(4)} ETH</div>
              </div>
              
              <button
                onClick={handleProceedToPayment}
                className="btn-primary w-full py-3 text-lg"
                disabled={quantity <= 0 || quantity > match.availableTickets}
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TicketBookingPage);