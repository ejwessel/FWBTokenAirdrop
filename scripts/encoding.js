const hre = require("hardhat");
const { ethers, artifacts } = hre
const BN = ethers.BigNumber
const neatCsv = require('neat-csv')
const fs = require('fs');
const chalk = require('chalk');
const FWB_PRO_ADDRESS = '0x35bd01fc9d6d5d81ca9e055db88dc49aa2c699a8'

// parse through data and construct input
fs.readFile('./airdropdata.csv', async (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  const airdropData = await neatCsv(data)
  const addresses = []
  const amounts = []

  await hre.run('compile');

  const ERC20 = artifacts.require('ERC20')
  const fwbProContract = await ethers.getContractAt(ERC20.abi, FWB_PRO_ADDRESS)
  const fwbDecimals = await fwbProContract.decimals()

  // collect all the balances in the correct format
  const base = new BN.from("10").pow(fwbDecimals)
  airdropData.forEach((account) => {
    addresses.push(account.address)
    // remove the commas
    let value = BN.from(account['FWB Pro Balance'].replace(',', '')).mul(base)
    amounts.push(value.toString())
  })

  const airdropFactory = await ethers.getContractFactory("AirdropPush");
  const airdropInterface = airdropFactory.interface
  const method = 'distribute(address,address[],uint256[])'

  // SET PAGE SIZE
  const pageSize = 10
  for (let i = 0; i < addresses.length; i += pageSize) {
    const batch = await airdropInterface.encodeFunctionData(
      method,
      [FWB_PRO_ADDRESS, addresses.slice(i, i + pageSize), amounts.slice(i, i + pageSize)]
    )
    console.log(`Batch ${i}`)
    console.log(chalk.green(batch))
    console.log()
  }
})