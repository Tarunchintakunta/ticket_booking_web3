import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import QRCode from 'qrcode.react';
import Web3Context from '../contexts/Web3Context';

// Pure function for date formatting
const formatDate = (timestamp) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const MyTicketsPage = () => {
  const { contract, account, isConnected, connectWallet } = React.useContext(Web3Context);
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState(null);
  
  // Add this ref to track if we've already fetched tickets
  const fetchAttemptedRef = useRef(false);

  // Fetch user tickets - key changes here to prevent infinite loop
  const fetchUserTickets = useCallback(async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch ticket IDs for the user
      const ticketIds = await contract.getUserTickets(account);
      
      // If no tickets, set empty array and stop loading
      if (!ticketIds || ticketIds.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }

      // Fetch details for each ticket
      const ticketPromises = ticketIds.map(async (id) => {
        try {
          const ticketDetails = await contract.getTicketDetails(account, id);
          const matchDetails = await contract.getMatchDetails(ticketDetails.matchId);
          
          return {
            id: id.toString(),
            matchId: ticketDetails.matchId.toString(),
            quantity: ticketDetails.quantity.toString(),
            purchaseDate: ticketDetails.purchaseDate.toString(),
            totalPrice: ethers.formatEther(ticketDetails.totalPrice),
            sport: matchDetails.sport,
            homeTeam: matchDetails.homeTeam,
            awayTeam: matchDetails.awayTeam,
            venue: matchDetails.venue,
            date: matchDetails.date.toString(),
          };
        } catch (error) {
          console.error(`Error fetching ticket ${id} details:`, error);
          return null;
        }
      });
      
      // Wait for all ticket details to be fetched
      const ticketsData = await Promise.all(ticketPromises);
      const validTickets = ticketsData.filter(ticket => ticket !== null);
      
      // Update tickets and stop loading
      setTickets(validTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [contract, account]); // Removed isConnected from the dependency array

  // Fetch tickets when dependencies change
  useEffect(() => {
    if (isConnected && contract && account && !fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      fetchUserTickets();
    }
  }, [isConnected, contract, account, fetchUserTickets]);

  // Reset the ref if important dependencies change
  useEffect(() => {
    if (!isConnected || !contract || !account) {
      fetchAttemptedRef.current = false;
    }
  }, [isConnected, contract, account]);

  // Toggle expanded ticket
  const toggleExpandTicket = useCallback((ticketId) => {
    setExpandedTicket(prevId => prevId === ticketId ? null : ticketId);
  }, []);

  // Generate QR code data
  const generateQRData = useCallback((ticket) => {
    return JSON.stringify({
      ticketId: ticket.id,
      matchId: ticket.matchId,
      owner: account,
      quantity: ticket.quantity,
      match: `${ticket.homeTeam} vs ${ticket.awayTeam}`,
      date: ticket.date,
      venue: ticket.venue,
    });
  }, [account]);

  // Render connection prompt if wallet not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
          <button onClick={connectWallet} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render tickets or no tickets message
  return (
    <div className="min-h-screen bg-secondary">
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Tickets</h1>

        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-xl text-gray-600 mb-4">You don't have any tickets yet</h3>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {tickets.map((ticket) => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket}
                expandedTicket={expandedTicket}
                toggleExpandTicket={toggleExpandTicket}
                generateQRData={generateQRData}
                account={account}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Ticket Card Component - with proper memoization
const TicketCard = React.memo(({ 
  ticket, 
  expandedTicket, 
  toggleExpandTicket, 
  generateQRData,
  account 
}) => {
  // Create QR data once per ticket
  const qrData = useMemo(() => generateQRData(ticket), [generateQRData, ticket]);
  
  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="md:flex-grow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {ticket.homeTeam} vs {ticket.awayTeam}
            </h3>
            <div className="mt-2 md:mt-0 px-3 py-1 bg-primary bg-opacity-10 text-primary text-sm font-medium rounded-full">
              {ticket.sport}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-gray-800">{formatDate(ticket.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Venue</p>
              <p className="text-gray-800">{ticket.venue}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="text-gray-800">{ticket.quantity} {parseInt(ticket.quantity) === 1 ? 'ticket' : 'tickets'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Purchase Date</p>
              <p className="text-gray-800">{formatDate(ticket.purchaseDate)}</p>
            </div>
            <button
              onClick={() => toggleExpandTicket(ticket.id)}
              className="text-primary hover:text-blue-700 flex items-center"
            >
              {expandedTicket === ticket.id ? 'Hide Details' : 'View Ticket'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ml-1 transition-transform ${
                  expandedTicket === ticket.id ? 'transform rotate-180' : ''
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {expandedTicket === ticket.id && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-4">Ticket Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Ticket ID</p>
                  <p className="text-gray-800 font-mono">{ticket.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Match ID</p>
                  <p className="text-gray-800 font-mono">{ticket.matchId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="text-gray-800 font-mono">{account}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Price</p>
                  <p className="text-gray-800">{ticket.totalPrice} ETH</p>
                </div>
                <div className="pt-2">
                  <a
                    href={`https://sepolia.etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    View on Etherscan
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <h4 className="text-lg font-medium text-gray-700 mb-4">Ticket QR Code</h4>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <QRCode
                  value={qrData}
                  size={200}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <p className="mt-3 text-sm text-gray-500">Show this QR code at the venue</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default React.memo(MyTicketsPage);