// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TicketBooking contract...");
  
  // Get the contract factory
  const TicketBooking = await ethers.getContractFactory("TicketBooking");
  
  // Deploy the contract
  const ticketBooking = await TicketBooking.deploy();
  
  // Wait for deployment to complete
  // In newer versions of ethers/hardhat, use this instead of deployed()
  await ticketBooking.waitForDeployment();
  
  // Get the contract address - different method in newer ethers.js
  const address = await ticketBooking.getAddress();
  
  console.log("TicketBooking deployed to:", address);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



// const hre = require("hardhat");

// async function main() {
//   const TicketBooking = await hre.ethers.getContractFactory("TicketBooking");
  
//   console.log("Deploying TicketBooking contract...");
  
//   const ticketBooking = await TicketBooking.deploy();
  
//   console.log("Waiting for deployment...");
//   await ticketBooking.deployed();
  
//   console.log("TicketBooking deployed to:", ticketBooking.address);

//   // Verify contract on Etherscan
//   await hre.run("verify:verify", {
//     address: ticketBooking.address,
//     contract: "contracts/TicketBooking.sol:TicketBooking"
//   });
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error("Deployment error:", error);
//     process.exit(1);
//   });