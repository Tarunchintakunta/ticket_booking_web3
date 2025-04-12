// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketBooking {
    struct Match {
        uint256 id;
        string sport;
        string homeTeam;
        string awayTeam;
        string venue;
        uint256 date;
        uint256 ticketPrice;
        uint256 availableTickets;
    }

    struct Ticket {
        uint256 id;
        uint256 matchId;
        address owner;
        uint256 quantity;
        uint256 purchaseDate;
        uint256 totalPrice;
    }

    address public owner;
    address public constant PAYMENT_RECEIVER = 0x078D8Db473Ab8Fe3036390A3B37C81AdA6c1E5A9;
    uint256 private nextMatchId = 1;
    uint256 private nextTicketId = 1;

    mapping(uint256 => Match) public matches;
    mapping(address => mapping(uint256 => Ticket)) public userTickets;
    mapping(address => uint256[]) public userTicketIds;

    event MatchCreated(uint256 matchId, string sport, string homeTeam, string awayTeam);
    event TicketPurchased(uint256 ticketId, uint256 matchId, address buyer, uint256 quantity);

   constructor() {
    owner = msg.sender;
    
    // Add some initial matches for testing
    createMatch("Cricket", "India", "Australia", "Sydney Cricket Ground", 1718294400, 0.01 ether, 100);
    createMatch("Cricket", "England", "West Indies", "Lords", 1719504000, 0.015 ether, 150);
    createMatch("Football", "Manchester United", "Liverpool", "Old Trafford", 1719936000, 0.02 ether, 200);
    createMatch("Football", "Real Madrid", "Barcelona", "Santiago Bernabeu", 1720368000, 0.025 ether, 250);
    createMatch("Basketball", "LA Lakers", "Chicago Bulls", "Staples Center", 1720800000, 0.015 ether, 180);
    createMatch("Basketball", "Boston Celtics", "Miami Heat", "TD Garden", 1721232000, 0.018 ether, 220);
}

    function createMatch(
        string memory _sport,
        string memory _homeTeam,
        string memory _awayTeam,
        string memory _venue,
        uint256 _date,
        uint256 _ticketPrice,
        uint256 _availableTickets
    ) public {
        require(msg.sender == owner, "Only owner can create matches");
        
        matches[nextMatchId] = Match(
            nextMatchId,
            _sport,
            _homeTeam,
            _awayTeam,
            _venue,
            _date,
            _ticketPrice,
            _availableTickets
        );
        
        emit MatchCreated(nextMatchId, _sport, _homeTeam, _awayTeam);
        nextMatchId++;
    }

    function purchaseTicket(uint256 _matchId, uint256 _quantity) public payable {
        Match storage matchData = matches[_matchId];
        
        require(matchData.id != 0, "Match does not exist");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(_quantity <= matchData.availableTickets, "Not enough tickets available");
        require(msg.value >= matchData.ticketPrice * _quantity, "Insufficient funds sent");
        
        matchData.availableTickets -= _quantity;
        
        Ticket memory newTicket = Ticket(
            nextTicketId,
            _matchId,
            msg.sender,
            _quantity,
            block.timestamp,
            matchData.ticketPrice * _quantity
        );
        
        userTickets[msg.sender][nextTicketId] = newTicket;
        userTicketIds[msg.sender].push(nextTicketId);
        
        // Forward the payment to the specified address
        (bool sent, ) = PAYMENT_RECEIVER.call{value: msg.value}("");
        require(sent, "Failed to forward payment");
        
        emit TicketPurchased(nextTicketId, _matchId, msg.sender, _quantity);
        nextTicketId++;
    }

    function getUserTickets(address _user) public view returns (uint256[] memory) {
        return userTicketIds[_user];
    }

    function getTicketDetails(address _user, uint256 _ticketId) public view returns (
        uint256 id,
        uint256 matchId,
        uint256 quantity,
        uint256 purchaseDate,
        uint256 totalPrice
    ) {
        Ticket memory ticket = userTickets[_user][_ticketId];
        return (
            ticket.id,
            ticket.matchId,
            ticket.quantity,
            ticket.purchaseDate,
            ticket.totalPrice
        );
    }

    function getMatchDetails(uint256 _matchId) public view returns (
        string memory sport,
        string memory homeTeam,
        string memory awayTeam,
        string memory venue,
        uint256 date,
        uint256 ticketPrice,
        uint256 availableTickets
    ) {
        Match memory matchData = matches[_matchId];
        return (
            matchData.sport,
            matchData.homeTeam,
            matchData.awayTeam,
            matchData.venue,
            matchData.date,
            matchData.ticketPrice,
            matchData.availableTickets
        );
    }

    function getMatchesBySport(string memory _sport) public view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count matches for this sport
        for (uint256 i = 1; i < nextMatchId; i++) {
            if (keccak256(bytes(matches[i].sport)) == keccak256(bytes(_sport))) {
                count++;
            }
        }
        
        uint256[] memory matchIds = new uint256[](count);
        uint256 index = 0;
        
        // Get match IDs for this sport
        for (uint256 i = 1; i < nextMatchId; i++) {
            if (keccak256(bytes(matches[i].sport)) == keccak256(bytes(_sport))) {
                matchIds[index] = i;
                index++;
            }
        }
        
        return matchIds;
    }
}