import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import Web3Context from '../contexts/Web3Context';

// Format timestamp to readable date
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const SportEventsPage = () => {
  const { sport } = useParams();
  const { contract, isConnected, connectWallet } = useContext(Web3Context);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Fetch events for this sport
  useEffect(() => {
    // Skip if we've already attempted a fetch or don't have necessary data
    if (hasAttemptedFetch || !isConnected || !contract) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasAttemptedFetch(true); // Mark that we've attempted a fetch
        
        console.log(`Fetching events for sport: ${sport}`);
        
        // Sport names in contract might be capitalized
        const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);
        
        // Get match IDs for this sport
        const matchIds = await contract.getMatchesBySport(sportName);
        console.log("Match IDs returned:", matchIds);
        
        if (matchIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }
        
        // Get details for each match
        const matchPromises = matchIds.map(async (id) => {
          try {
            const details = await contract.getMatchDetails(id);
            
            return {
              id: id.toString(),
              sport: details.sport,
              homeTeam: details.homeTeam,
              awayTeam: details.awayTeam,
              venue: details.venue,
              date: details.date.toString(),
              ticketPrice: ethers.formatEther(details.ticketPrice),
              availableTickets: details.availableTickets.toString(),
            };
          } catch (error) {
            console.error(`Error fetching match ${id} details:`, error);
            return null;
          }
        });
        
        const matchesData = await Promise.all(matchPromises);
        const validMatches = matchesData.filter(match => match !== null);
        
        setEvents(validMatches);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError(`Error loading events: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [contract, sport, isConnected, hasAttemptedFetch]);

  // Reset fetch state when sport changes
  useEffect(() => {
    setHasAttemptedFetch(false);
    setEvents([]);
    setLoading(true);
  }, [sport]);

  // Handle wallet connection
  const handleConnect = async () => {
    await connectWallet();
  };

  // Filtered events based on search
  const filteredEvents = events.filter(
    (event) =>
      event.homeTeam.toLowerCase().includes(search.toLowerCase()) ||
      event.awayTeam.toLowerCase().includes(search.toLowerCase()) ||
      event.venue.toLowerCase().includes(search.toLowerCase())
  );

  // Capitalize first letter of sport for display
  const displaySport = sport.charAt(0).toUpperCase() + sport.slice(1);

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

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container-custom">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mr-3 text-primary hover:text-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{displaySport} Events</h1>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by team or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h3 className="text-xl text-red-600 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-600">No events found</h3>
            <p className="mt-2 text-gray-500">
              Try checking back later for upcoming {displaySport} events
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {event.homeTeam} vs {event.awayTeam}
                    </h3>
                    
                    <div className="mb-4">
                      <div className="flex items-center text-gray-600 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.venue}
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.date)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-semibold text-primary">
                        {event.ticketPrice} ETH
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.availableTickets} tickets available
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Link
                      to={`/book/${event.id}`}
                      className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 whitespace-nowrap"
                    >
                      Book Tickets
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SportEventsPage;