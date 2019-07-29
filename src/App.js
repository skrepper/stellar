import React from 'react';
import StellarSdk  from 'stellar-sdk';

const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
StellarSdk.Network.useTestNetwork();
const UNLOCK_MINUTES = 2;
let unlockDate = null;
const fee = StellarSdk.BASE_FEE;
let sequenceNumber=null;

const src = StellarSdk.Keypair.fromSecret("SABBFFY2Q36ERGUG4SIXUPYFMXXZAFP6B7MMGMSBCQBJU4V2NZQ6EXU7");
let escrow = StellarSdk.Keypair.fromSecret("SDIKUDHIRTCP4E7GHW73VR2NV4H3ZO3HANTGAAKB34NMNP5GUKUOYBFR");
// destination public key (secret="SBKKJ76V4HPMVJWME72FRWI5D74RRGDY6CDRANJTZVL44ZOTGAROHFTG")
let dest = StellarSdk.Keypair.fromPublicKey("GDKBCHIT7OSLFGQH24XO6LYQJSSOHBEHQDWCNS5QZHHCHRMVFJ275MLF");


export default class App extends React.Component {
	constructor() {
		super();
		this.state = {
			escrowpublickey: escrow.publicKey(),
			escrowsecretkey: escrow.secret(),
			paymentInfoKey: "here will be hash",
			destPublicKey: "GDKBCHIT7OSLFGQH24XO6LYQJSSOHBEHQDWCNS5QZHHCHRMVFJ275MLF" ,
			xdrUnlockOrigin: "here will be XDR",
			xdrUnlockDestination: "",
			xdrRecoveryOrigin: "here will be XDR",
			xdrRecoveryDestination: "",
			paymentAccount: "" + 100
		};
		this.CreateAccount = this.CreateAccount.bind(this);
		this.Payment = this.Payment.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
		this.EnablingMultiSig = this.EnablingMultiSig.bind(this);
		this.UnlockDate = this.UnlockDate.bind(this);
		this.handleTextAreaChangeTxn3 = this.handleTextAreaChangeTxn3.bind(this);
		this.handleTextAreaChangeTxn4 = this.handleTextAreaChangeTxn4.bind(this);
		this.SubmitTrn_N_3 = this.SubmitTrn_N_3.bind(this);
		this.SubmitTrn_N_4 = this.SubmitTrn_N_4.bind(this);
		this.RecoveryTrn = this.RecoveryTrn.bind(this);
		this.handleInputPaymentAccount = this.handleInputPaymentAccount.bind(this);
	}
	Payment() {
		server.loadAccount(src.publicKey())
		.then((sourceAccount) =>{ 
			const transaction5 = new StellarSdk.TransactionBuilder(sourceAccount, {fee:fee})
				.addOperation(
					StellarSdk.Operation.payment({
						destination: escrow.publicKey(),
						asset: StellarSdk.Asset.native(),
						amount: this.state.paymentAccount // in XLM
					})
				)
				.setTimeout(StellarSdk.TimeoutInfinite)
				.build();
			transaction5.sign(StellarSdk.Keypair.fromSecret(src.secret()));
			return server.submitTransaction(transaction5)		
			.then((result) => {
				console.log('Success! Results:', result);
				this.setState({paymentInfoKey: result.hash});
				})
			.catch(function(error) {
					console.error('Something went wrong!', error);
			});
		}).catch(err => {
			console.error("ERROR!", err);
			});
	}
	
	CreateAccount() {
		escrow = StellarSdk.Keypair.random();
		this.setState({ escrowpublickey: escrow.publicKey() });
		this.setState({ escrowsecretkey: escrow.secret() });
		server.loadAccount(src.publicKey())
			.then(function(sourceAccount) {
				let txn = new StellarSdk.TransactionBuilder(sourceAccount, {fee:fee})
					.addOperation(StellarSdk.Operation.createAccount({
						destination: escrow.publicKey(),
						startingBalance: "100"
					  }
					  )
					)
					.setTimeout(StellarSdk.TimeoutInfinite)
					.addMemo(StellarSdk.Memo.text('create account')
					)
					.build();
		txn.sign(src);
		return server.submitTransaction(txn);
		})
		.then(function(result) {
			console.log('Success! Results:', result);
		})
		.catch(function(error) {
			console.error('Something went wrong!', error);
		});}
		
	EnablingMultiSig() {
		dest = StellarSdk.Keypair.fromPublicKey(this.state.destPublicKey);
		server.loadAccount(escrow.publicKey())
			.then(function (escrowAccount) {
			const transaction2 = new StellarSdk.TransactionBuilder(escrowAccount, {fee:fee})
			.addOperation(
			StellarSdk.Operation.setOptions({
				signer: {
				ed25519PublicKey: dest.publicKey(),
				weight: 1
			}
			})
			)
			.addOperation(
			StellarSdk.Operation.setOptions({
				masterWeight: 1,
				lowThreshold: 2,
				medThreshold: 2,
				highThreshold: 2
			})
			  )
		  .setTimeout(StellarSdk.TimeoutInfinite)
		  .build();
		  transaction2.sign(StellarSdk.Keypair.fromSecret(escrow.secret()));
		  return server.submitTransaction(transaction2);
	  })
	  .then(function(result) {
		console.log('Success! Results:', result);
	  })
	  .catch(function(error) {
		console.error('Something went wrong!', error);
	  });}
	
	handleInputChange(event) {
		let t_escrowsecretkey = "";
		if (typeof event.target.value === 'string') {
			t_escrowsecretkey = event.target.value;
			if (t_escrowsecretkey.length===56) {
				this.setState({escrowsecretkey: t_escrowsecretkey});
				escrow = StellarSdk.Keypair.fromSecret(t_escrowsecretkey);
				this.setState({escrowpublickey: escrow.publicKey()});
			};
		}
	}
	
	UnlockDate() {
		unlockDate = new Date(new Date().getTime() + UNLOCK_MINUTES * 60000);
		console.log(`Unlock date in ${UNLOCK_MINUTES} minutes:`, unlockDate);
		const unixUnlock = Math.round(unlockDate.getTime() / 1000);
		console.log("Unix unlock date", unixUnlock);
		server.loadAccount(escrow.publicKey())
			.then( (escrowAccount) => {
				  sequenceNumber = escrowAccount.sequenceNumber();
				  console.log("sequenceNumber", sequenceNumber);
				  
				  const transaction3 = new StellarSdk.TransactionBuilder(
					new StellarSdk.Account(escrow.publicKey(), sequenceNumber),
					{
					  timebounds: {
						minTime: unixUnlock,
						maxTime: 0
					  },
					  fee:fee
					}
				  )
					.addOperation(
					  StellarSdk.Operation.setOptions({
						masterWeight: 0,
						lowThreshold: 1,
						medThreshold: 1,
						highThreshold: 1
					  })
					)
					.setTimeout(UNLOCK_MINUTES * 60) //StellarSdk.TimeoutInfinite
					.build();
				  transaction3.sign(StellarSdk.Keypair.fromSecret(escrow.secret()));				
				  console.log(transaction3.toEnvelope().toXDR("base64"));
				  this.setState({ xdrUnlockOrigin: transaction3.toEnvelope().toXDR("base64") });
	  })
	  .then(function(result) {
		console.log('Success! Results:', result);
	  })
	  .catch(function(error) {
		console.error('Something went wrong!', error);
	  });
	}
	
	handleTextAreaChangeTxn3(event) {
		this.setState({xdrUnlockDestination: event.target.value});
	}

	handleTextAreaChangeTxn4(event) {
		this.setState({xdrRecoveryDestination: event.target.value});
	}
	
	SubmitTrn_N_3() {
	const transaction = new StellarSdk.Transaction(this.state.xdrUnlockDestination);
	console.log(transaction);
	server.loadAccount(escrow.publicKey())
			.then(function (escrowAccount) {
		  return server.submitTransaction(transaction);
	  })
	  .then(function(result) {
		console.log('Success! Results:', result);
	  })
	  .catch(function(error) {
		console.error('Something went wrong!', error);
	  });
	}

	SubmitTrn_N_4() {
	const transaction = new StellarSdk.Transaction(this.state.xdrRecoveryDestination);
	console.log(transaction);
	server.loadAccount(escrow.publicKey())
			.then(function (escrowAccount) {
		  return server.submitTransaction(transaction);
	  })
	  .then(function(result) {
		console.log('Success! Results:', result);
	  })
	  .catch(function(error) {
		console.error('Something went wrong!', error);
	  });
	}

	
	RecoveryTrn() {
      const recoveryDate = new Date(
        unlockDate.getTime() + UNLOCK_MINUTES * 60000
      );
      const unixRecovery = Math.round(recoveryDate.getTime() / 1000);
      console.log("Unix recovery time", unixRecovery);
      server.loadAccount(escrow.publicKey())
			.then( (escrowAccount) => {
				  const transaction4 = new StellarSdk.TransactionBuilder(
					new StellarSdk.Account(escrow.publicKey(), sequenceNumber),
					{
					  timebounds: {
						minTime: unixRecovery,
						maxTime: 0
					  },
					  fee:fee
					}
				  )
					.addOperation(
					  StellarSdk.Operation.setOptions({
						signer: {
						  ed25519PublicKey: dest.publicKey(),
						  weight: 0
						},
						lowThreshold: 1,
						medThreshold: 1,
						highThreshold: 1
					  })
					)
					.setTimeout(UNLOCK_MINUTES * 60) //StellarSdk.TimeoutInfinite
					.build();
				  transaction4.sign(StellarSdk.Keypair.fromSecret(escrow.secret()));				
				  console.log(transaction4.toEnvelope().toXDR("base64"));
				  this.setState({ xdrRecoveryOrigin: transaction4.toEnvelope().toXDR("base64") });
	  })
	  .then(function(result) {
		console.log('Success! Results:', result);
	  })
	  .catch(function(error) {
		console.error('Something went wrong!', error);
	  });
    }
	
	handleInputPaymentAccount(event) {
		let t_PaymentAccount = 0;
		t_PaymentAccount = event.target.value * 1;
		if (typeof t_PaymentAccount === 'number') {
			if (t_PaymentAccount > 0) {
				this.setState({paymentAccount: "" + t_PaymentAccount});
			}
		}
	}
	
  render() {
	return (
    <div className="App">
	{/*<div>
		Source operations
	</div>*/}
	  <div>
		<button onClick={this.CreateAccount}>Create Escrow account (transaction N 1)</button>
	  </div>
	  <div>
		Escrow public key: 
		{this.state.escrowpublickey}
	  </div>
	  <div>
		Escrow secret key: {this.state.escrowsecretkey}
	  </div>
	  <div>
		<input type="text" name="name1" 
			style={{width: "600px"}} 
			placeholder = "Enter here new escrow secret key"
			onChange={this.handleInputChange} />
	  </div>
	  <div> 
		<input type="text" name="name31" 
			style={{width: "200px"}} 
			placeholder = "Enter here new payment account"
			onChange={this.handleInputPaymentAccount} /> (now {this.state.paymentAccount})
	  </div>
	  <div>
		<button onClick={this.Payment}>Payment (transaction N 5)</button>
	  </div>
	  <div>
		Payment transaction hash: {this.state.paymentInfoKey}
	  </div>
	  {/*<br/>
	  <div>
		Escrow operations
	  </div>*/}
	  <div>
		Destination public key: {this.state.destPublicKey}
	  </div>
	  <div>
		<button onClick={this.EnablingMultiSig}>Enabling Multi-sig (transaction N 2)</button>
	  </div>
	  <div>
		<div>
			<button onClick={this.UnlockDate}>Unlock by origin (transaction N 3)</button>
		</div>
		<div>XDR of Unlock by origin: </div>
		<div>
		{this.state.xdrUnlockOrigin}
		</div>
		<div>
			<div>Copy to clipboard and send client to sign on 
				<a href="https://www.stellar.org/laboratory/#txsigner?network=test">
					https://www.stellar.org/laboratory/#txsigner?network=test
				</a>
			</div>
			<div>After sign client must send us new XDR</div>
		</div>
		<div>
			<div>New signed by client XDR</div>
			<textarea name="name2" 
				style={{width: "600px"}} 
				placeholder = "Enter here new XDR"
				onChange={this.handleTextAreaChangeTxn3}
			/>
			<div>
				<button onClick={this.SubmitTrn_N_3}>Submit (transaction N 3)</button>
			</div>
		</div>
		<div>
			<div>
				<div>This transaction must be executed right away Transaction N 3 with the same sequence number</div>
				<button onClick={this.RecoveryTrn}>Recovery (transaction N 4)</button>
			</div>
			<div>XDR of Recovery by origin: </div>
			<div>
			{this.state.xdrRecoveryOrigin}
			</div>
			<div>
				<div>Copy to clipboard and send client to sign on 
					<a href="https://www.stellar.org/laboratory/#txsigner?network=test">
						https://www.stellar.org/laboratory/#txsigner?network=test
					</a>
				</div>
				<div>After sign client must send us new XDR</div>
			</div>
		</div>
		<div>
			<div>New signed by client XDR</div>
			<textarea name="name21" 
				style={{width: "600px"}} 
				placeholder = "Enter here new XDR"
				onChange={this.handleTextAreaChangeTxn4}
			/>
			<div>
				<button onClick={this.SubmitTrn_N_4}>Submit (transaction N 4)</button>
			</div>
		</div>
	  </div>
    </div>
	)};
}

