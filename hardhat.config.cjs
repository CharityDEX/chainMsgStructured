require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      chainId: 1337,
    },
    hardhat: {
      chainId: 1337,
    },
    production: {
      chainId: parseInt(process.env.ETH_CHAIN_ID),
      url: process.env.ETH_RPC_URL,
      accounts: [process.env.ETH_PRIVATE_KEY],
    },
  },
};
