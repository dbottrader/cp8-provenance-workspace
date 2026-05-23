const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const CP8Oracle = await hre.ethers.getContractFactory("CP8Oracle");
  const oracle = await CP8Oracle.deploy(deployer.address);
  await oracle.waitForDeployment();
  console.log("CP8Oracle deployed to:", await oracle.getAddress());

  const HarmonicCoin = await hre.ethers.getContractFactory("HarmonicCoin");
  const hhc = await HarmonicCoin.deploy(deployer.address);
  await hhc.waitForDeployment();
  console.log("HarmonicCoin deployed to:", await hhc.getAddress());

  // Set oracle
  await hhc.setOracle(await oracle.getAddress());
  console.log("Oracle linked to HarmonicCoin");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
