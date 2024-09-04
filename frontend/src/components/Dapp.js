import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import QVArtifact from "../contracts/QuadraticVoting.json";
import MockERC20 from "../contracts/MockERC20.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";

// This is the default id used by the Hardhat Network
const HARDHAT_NETWORK_ID = '31337';
const FHE_NETWORK_ID_HEX = parseInt(4268870).toString(16);

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers, the mocked Token and QV contract
//   3. Polls the user balance to keep it updated.
//   4. TODO: Enables owner to start a voting
//   5. TODO: Enables token holders to vote
//
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      
      startDate: undefined,
      endDate: undefined,
      options: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install a wallet.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {this.state.tokenData.name} ({this.state.tokenData.symbol})
            </h1>
            <p>
              Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
              <b>
                {this.state.balance.toString()} {this.state.tokenData.symbol}
              </b>
              .
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            <h2 className="mb-4">
              Create new voting
            </h2>

        <div className="row">
            <div className="col-6 mb-3">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                    defaultValue={this._convertUnixToDatetimeLocal(this.state.startDate)}
                    onChange={this._handleInputChange}
                    type="datetime-local" className="form-control" id="startDate" required>
                </input>
                <div className="invalid-feedback">
                    Please select a start date.
                </div>
            </div>
            <div className="col-6 mb-3">
            <label htmlFor="endDate" className="form-label">End Date</label>
            <input 
                defaultValue={this._convertUnixToDatetimeLocal(this.state.endDate)} 
                onChange={this._handleInputChange}
                type="datetime-local" className="form-control" id="endDate" required></input>
            <div className="invalid-feedback">
            Please select an end date.
            </div>
            </div>
        </div>

        <div className="row">
            <label htmlFor="options" className="col-12 form-label">Amount of Options</label>
            <div className="mb-3 col-12" style={{ display: "flex", alignItems: "center", gap: "1rem"}}>
                <div>
                    <input
                        defaultValue={this.state.options ?? 3} 
                        onChange={this._handleInputChange}
                        type="number" className="form-control" id="options" min="3" required></input>
                    <div className="invalid-feedback">
                        Please enter the number of options.
                    </div>
                </div>

                <button type="submit" className="btn btn-warning" onClick={() => this._handleCreateVoting()}>Create Voting</button>
                { this.state.inputError }
            </div>
        </div>

            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}


            <h2>
              Pending votings ({this.state.newVotings.length})
            </h2>

            <h2>
              Ongoing votings ({this.state.openVotings.length})
            </h2>

            <h2>
              Closed votings ({this.state.pastVotings.length})
            </h2>

            {/* 
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {/*
              If the user has no tokens, we don't show the Transfer form
            */}
            {this.state.balance.eq(0) && (
              <NoTokensMessage selectedAddress={this.state.selectedAddress} />
            )}

            {/*
              This component displays a form that the user can use to send a 
              transaction and transfer some tokens.
              The component doesn't have logic, it just calls the transferTokens
              callback.
            */}
            {this.state.balance.gt(0) && (
              <Transfer
                transferTokens={(to, amount) =>
                  this._transferTokens(to, amount)
                }
                tokenSymbol={this.state.tokenData.symbol}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  _convertUnixToDatetimeLocal = (unixTimestamp) => {
    const date = new Date(unixTimestamp * 1000); // Convert to milliseconds
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  _normalizeTimestamp = (timestamp) => {
    if (timestamp.toString().length === 10) {
        return timestamp * 1000;
    } else if (timestamp.toString().length === 13) {
        return timestamp;
    } else {
        throw new Error('Invalid timestamp length');
    }
  }

  _handleInputChange = (e) => {
      this.state[e.target.id] = e.target.value;
  }

  async _handleCreateVoting() {
    const now = Math.floor(Date.now() / 1000);

    const startDate = this._normalizeTimestamp(new Date(this.state.startDate).getTime());
    const endDate = this._normalizeTimestamp(new Date(this.state.endDate).getTime());
    const options = this.state.options ?? 3;

    if (this.state.startDate >= this.state.endDate || startDate < now) {
        this.state.inputError = "invalid date!";
        return;
    }
    if (options < 3) {
        this.state.inputError = "input at least 3 options!";
        return;
    }

    this.state.txBeingSent = true;

    try {
      const tx = await this._qvContract.createVoting(startDate, endDate, options);
      const receipt = await tx.wait();
      console.log(receipt);

      // update frontend
      this._getVotingData();
    } catch(e) {
      this.state.inputError = "tx failed!";
      console.log(e);
    }
    this.state.txBeingSent = false;
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Once we have the address, we can initialize the application.

    // First we check the network
    this._checkNetwork();

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    this._getTokenData();
    this._getVotingData();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._qvContract = new ethers.Contract(
        "0x7C1BE03Aa7489C4D7d4cc295De13b8c4BDD6b61b",
        QVArtifact.abi,
        this._provider.getSigner(0)
    );

    this._token = new ethers.Contract(
        "0x5B0ABc8c4e9Cd491C2A204bf8581Da3Ad9284ff9",
        MockERC20.abi,
        this._provider.getSigner(0)
    );
  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _getVotingData() {
    const votings = await this._qvContract.getVotings();

    const blockNumber = await this._provider.getBlockNumber();
    const block = await this._provider.getBlock(blockNumber);
    const currentTimestamp = block.timestamp;

    const newVotings = [];
    const openVotings = [];
    const pastVotings = [];

    for (let i in votings) {
        const startDate = votings[i].startDate;
        const endDate = votings[i].endDate;

        if (currentTimestamp < startDate) {
            newVotings.push(votings[i]);
        }
        else if (currentTimestamp >= startDate && currentTimestamp <= endDate) {
            openVotings.push(votings[i]);
        }
        else {
            pastVotings.push(votings[i]);
        }
    }

    this.setState({ newVotings });
    this.setState({ openVotings });
    this.setState({ pastVotings });

    const now = Math.floor(Date.now() / 1000);
    this.state.startDate = now;
    this.state.endDate =  now + (7 * 24 * 60 * 60);
  }

  async _updateBalance() {
    if (this.state.selectedAddress != undefined) {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
    } else {
      console.warn('cant fetch balance');
    }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: FHE_NETWORK_ID_HEX }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  // This method checks if the selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion !== FHE_NETWORK_ID_HEX) {
      this._switchChain();
    }
  }
}
