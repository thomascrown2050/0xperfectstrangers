import React, { useState } from 'react'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import axios from 'axios'
 
let userAddress;

/* pages/index.js */
const ConnectWallet = () => {
  const [account, setAccount] = useState('')
  const [connection, setConnection] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  async function getWeb3Modal() {
    let Torus = (await import('@toruslabs/torus-embed')).default
    const web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: false,
      providerOptions: {
        torus: {
          package: Torus
        },
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: 'your-infura-id'
          },
        },
      },
    })
    return web3Modal
  }

  async function connect() {
    const web3Modal = await getWeb3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const accounts = await provider.listAccounts()
    setConnection(connection)
    setAccount(accounts[0])
    userAddress = accounts[0];
  }

var user_eth_balance_int;
var user_eth_balance_int_eth;
  async function getEthBalance(){
    const url = 'https://eth-mainnet.g.alchemy.com/v2/OTKyI_WNzt1-MD6xattomT_PHzKdakHF';
    const options = {
      method: 'POST',
      headers: {accept: 'application/json', 'content-type': 'application/json'},
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [
          userAddress, 'latest'
        ]
      })
    };
    
    await fetch(url, options)
      .then(res => res.json())
      .then(json => {
       user_eth_balance_int = parseInt(json['result']);
       user_eth_balance_int_eth = ethers.utils.formatEther(ethers.BigNumber.from(user_eth_balance_int.toString()));
       document.getElementById("eth_balance").innerHTML = user_eth_balance_int_eth;
      })
      .catch(err => console.error('error:' + err));
  }

  
/*12/12/22: Alchemy feedback: long list of token addresses - how am I supposed to know which contract this is? Why doesn't it give me the contract name and metadata in the response? 
Sure I can make a separate call but it's a lot of work. In general not clear what is optional/required.
*/

var token_balance_json_data; 
var token_balance_array;
var length_tokens;

async function updateContractMetadata(){  
  for(let i=0;i<length_tokens;i++){
    if(token_balance_array["tokenBalances"][i]["tokenBalance"]!="0x0000000000000000000000000000000000000000000000000000000000000000"){
    var thisContract = token_balance_array["tokenBalances"][i]["contractAddress"];
    var thisBalance = token_balance_array["tokenBalances"][i]["tokenBalance"];
    var contractSpanId = "balance_label_"+thisContract; 

  const options = {
    method: 'POST',
    url: 'https://eth-mainnet.g.alchemy.com/v2/OTKyI_WNzt1-MD6xattomT_PHzKdakHF',
    headers: {accept: 'application/json', 'content-type': 'application/json'},
    data: {
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getTokenMetadata',
      params: [thisContract]
    }
  }
  
  await axios
    .request(options)
    .then(function (response) {
      var tokenMetadataResponse = response.data;
      var tokenMetadataResponse_symbol = tokenMetadataResponse["result"]["symbol"];
      var tokenMetadataResponse_decimals = tokenMetadataResponse["result"]["decimals"];
      //this is a weird necessary formatting
      var decimal_adjustment = parseInt(10)**parseInt(tokenMetadataResponse_decimals);
      var tokenBalanceFormatted = (thisBalance / decimal_adjustment);
      document.getElementById(contractSpanId).innerHTML = tokenMetadataResponse_symbol+": "+tokenBalanceFormatted+"<br />";
    })
  }
}
  };
  

async function getTokenBalances(){  
const options = {
  method: 'POST',
  url: 'https://eth-mainnet.g.alchemy.com/v2/OTKyI_WNzt1-MD6xattomT_PHzKdakHF',
  headers: {accept: 'application/json', 'content-type': 'application/json'},
  data: {
    id: 1,
    jsonrpc: '2.0',
    method: 'alchemy_getTokenBalances',
    params: [userAddress, "DEFAULT_TOKENS"]
  }
};

//Get the token balance per token and reuse once you have contract metadata
var thisTokenBalance;
var thisTokenBalance_dec;

axios
  .request(options)
  .then(function (response) {
    token_balance_json_data = response.data;
    token_balance_array = token_balance_json_data['result'];
  length_tokens = token_balance_array["tokenBalances"].length;

  for(let i=0; i<length_tokens; i++){
    if(token_balance_array["tokenBalances"][i]["tokenBalance"]!="0x0000000000000000000000000000000000000000000000000000000000000000"){
var thisContractAddress = token_balance_array["tokenBalances"][i]["contractAddress"];
thisTokenBalance = token_balance_array["tokenBalances"][i]["tokenBalance"];
thisTokenBalance_dec = parseInt(thisTokenBalance);

document.getElementById("other_tokens_balance").innerHTML += "<span id='balance_label_"+thisContractAddress+"'>"+thisContractAddress+""+thisTokenBalance_dec+"</span><br />";
    }
  }  
updateContractMetadata();
  }
  )
  .catch(function (error) {
    console.error(error);
  });

}

async function getNFTsOwned(){
  const url = "https://eth-mainnet.g.alchemy.com/nft/v2/OTKyI_WNzt1-MD6xattomT_PHzKdakHF/getNFTs?owner="+userAddress+"&orderBy=TRANSFER_TIME&excludeFilters=[SPAM, AIRDROPS]";
  const options = {
    method: 'GET',
  };

  const resp = await axios.get(url)
  console.log(resp.data)
  var userNFTs = resp.data;
  var NFTlength = userNFTs["ownedNfts"].length;

  for(let i=0; i<NFTlength; i++){
var nft_collection_name = userNFTs["ownedNfts"][i]["contractMetadata"]["name"];
var nft_collection_symbol = userNFTs["ownedNfts"][i]["contractMetadata"]["symbol"];
console.log(nft_collection_name);

var is_name_undefined = typeof nft_collection_name;
console.log(is_name_undefined);

if(is_name_undefined==="undefined"){
  nft_collection_name = userNFTs["ownedNfts"][i]["contractMetadata"]["openSea"]["collectionName"];
  nft_collection_symbol = "No symbol";
}

/*
if(nft_collection_name!=="undefined"&&nft_collection_name!=""){
}
else if(nft_collection_name==="undefined"||nft_collection_name==""){
nft_collection_name = userNFTs["ownedNfts"][i]["contractMetadata"]["openSea"]["collectionName"];
nft_collection_symbol = "No symbol";
}else{
nft_collection_name = "Not available";
nft_collection_symbol = "No symbol";
}
*/

var nft_collection_presented = nft_collection_name + " ("+nft_collection_symbol+")";

var nft_name = userNFTs["ownedNfts"][i]["metadata"]["name"];
var nft_image = userNFTs["ownedNfts"][i]["metadata"]["image"];
var nft_image_gateway = userNFTs["ownedNfts"][i]["media"][0]["gateway"];
var nft_to_print;

if(nft_image_gateway==""){
nft_to_print = nft_image;
}else{
  nft_to_print = nft_image_gateway;
}

//Prevent showing an undefined image/NFT
if(nft_to_print=='undefined'){
nft_to_print = "";
}

//Would be nice to filter by ENS, other types
//Add link to view it on OpenSea, other marketplaces
//Fails for mp4s, some sites, doesn't catch untitled src 
if(nft_name||nft_to_print!=""){
document.getElementById("nfts_container").innerHTML += "<span id='nft_label_"+nft_name+"'>"+nft_collection_presented+": "+nft_name+"<img style='max-height:25px;' src='"+nft_to_print+"' /></span><br />";
}
}
}

  if(userAddress!=undefined && loggedIn!=false){
    getTokenBalances();
    getEthBalance();
    getNFTsOwned();
  }
  


/*
  async function getNFTtransfers(){
    const url = 'https://eth-mainnet.g.alchemy.com/nft/v2/OTKyI_WNzt1-MD6xattomT_PHzKdakHF/getNFTs?owner=0xshah.eth&orderBy=TRANSFER_TIME&excludeFilters=[SPAM, AIRDROPS]';
    const options = {
      method: 'GET',
    };

    const resp = await axios.get(url)
    console.log(resp.data)
  }
  getNFTtransfers();
*/

  /*
  if(userAddress!=undefined){
  getAddressActivity();
  console.log(user_eth_balance);
  }
*/

  /* Template Alchemy API call
  async function dataPull(){
    const url = 'https://eth-mainnet.g.alchemy.com/v2/OTKyI_WNzt1-MD6xattomT_PHzKdakHF';
    const options = {
      method: 'POST',
      headers: {accept: 'application/json', 'content-type': 'application/json'},
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_getBlockByHash',
        params: [
          '0x63392b0dbab8cecbf16a8174f6ee7c2fd58a01d1f9bd5599aa422d0c782908d5', true
        ]
      })
    };
    
    fetch(url, options)
      .then(res => res.json())
      .then(json => console.log(json))
      //.then(json => res.send(json))
      .catch(err => console.error('error:' + err));

  }
  dataPull();
  */

/* Concept: Working eth_call for USDT at a moment in time 
  async function ethCallTest(){

// Replace with your Alchemy API key:
const apiKey = "OTKyI_WNzt1-MD6xattomT_PHzKdakHF";

const fetchURL = `https://eth-mainnet.g.alchemy.com/v2/OTKyI_WNzt1-MD6xattomT_PHzKdakHF`;

    // Wallet Address
const walletAddress = "0xef0dcc839c1490cebc7209baa11f46cfe83805ab";

// USDT Contract Address
const contractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const numDecimals = 6;

// Block number
const blockNum = 12026456;

// ABI
let abi = [
    'function balanceOf(address account)'
];

// Create function call data
let iface = new ethers.utils.Interface(abi)
let edata = iface.encodeFunctionData("balanceOf", [walletAddress]);

var raw = JSON.stringify({
    "jsonrpc": "2.0",
    "method": "eth_call", // usage of eth_call
    "headers": {
        "Content-Type": "application/json"
    },
    "params": [
        {
            to: contractAddress,
            data: edata,
        },
        ethers.utils.hexlify(blockNum).toString(),
    ],
    "id": 1
});

var requestOptions = {
    method: 'POST',
    body: raw,
    redirect: 'follow'
};

// Make the request and print the formatted response:
fetch(fetchURL, requestOptions)
    .then(response => response.json())
    .then(response => {
      let balance = response['result'];
      //let balance = response['data']['result'];
        balance = (parseInt(balance) / 10 * numDecimals).toFixed(2);
        //console.log("Balance:", balance, "USDT");
        //console.log(response); 
        console.log(balance);
    })
    .catch(error => console.log('error', error));
  }
  ethCallTest();
  */  

  async function signIn() {
    const authData = await fetch(`/api/auth?address=${account}`)
    const user = await authData.json()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const signature = await signer.signMessage(user.nonce.toString())
    const response = await fetch(`/api/verify?address=${account}&signature=${signature}`)
    const data = await response.json()
    setLoggedIn(data.authenticated)
  }

  return(
      <div style={container}>
        {
          !connection && <button style={button} onClick={connect}> Connect Wallet</button>
        }
        { connection && !loggedIn && (
          <div>
            <button style={button} onClick={signIn}>Sign In</button>
          </div>
        )}
        {
          loggedIn && <div><h1>Welcome, {account}</h1>
          <p>ETH Balance: <span id='eth_balance'></span></p>
          <p>Other tokens: <br /><span id='other_tokens_balance'></span></p>
          <p>NFTs: <br /><span id='nfts_container'></span></p>
          </div>
         }
      </div>
  )
}

const container = {
width: '900px',
margin: '50px auto'
}

const button = {
width: '100%',
margin: '5px',
padding: '20px',
border: 'none',
backgroundColor: 'black',
color: 'white',
fontSize: 16,
cursor: 'pointer'
}

export default ConnectWallet