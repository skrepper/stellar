import React from 'react';
import StellarSdk  from 'stellar-sdk';

const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
StellarSdk.Network.useTestNetwork();
const UNLOCK_MINUTES = 2;
const fee = StellarSdk.BASE_FEE;

const srcPublic = "GBH7SBDDSQIFRXHDWEMVAHJTQOYLAAXDVNQBGHKQS5GKLLG32ECHJC6U";
const srcSecret = "SABBFFY2Q36ERGUG4SIXUPYFMXXZAFP6B7MMGMSBCQBJU4V2NZQ6EXU7";
const src = StellarSdk.Keypair.fromSecret(srcSecret);

const escPublic = "GCRNWBYAQVZ6XHZ7XGSRZEKIM4IXBT5JVTN6GEJZZQR2MIUXQA3SQCQS";
const escSecret = "SDIKUDHIRTCP4E7GHW73VR2NV4H3ZO3HANTGAAKB34NMNP5GUKUOYBFR";

let escrow = StellarSdk.Keypair.fromSecret(escSecret);
let dest = "";


export default class App extends React.Component {
	constructor() {
		super();
		this.state = {
			escrowpublickey: escrow.publicKey(),
			escrowsecretkey: escrow.secret(),
			paymentInfoKey: "here will be hash",
			// destination public key (secret="SBKKJ76V4HPMVJWME72FRWI5D74RRGDY6CDRANJTZVL44ZOTGAROHFTG")
			destPublic: "GDKBCHIT7OSLFGQH24XO6LYQJSSOHBEHQDWCNS5QZHHCHRMVFJ275MLF" 
		};
		this.CreateAccount = this.CreateAccount.bind(this);
		this.Payment = this.Payment.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
		this.EnablingMultiSig = this.EnablingMultiSig.bind(this);
		
	}
	Payment() {
		server.loadAccount(src.publicKey())
		.then((sourceAccount) =>{ 
			const transaction5 = new StellarSdk.TransactionBuilder(sourceAccount, {fee:100})
				.addOperation(
					StellarSdk.Operation.payment({
						destination: escrow.publicKey(),
						asset: StellarSdk.Asset.native(),
						amount: "100" // in XLM
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
				let txn = new StellarSdk.TransactionBuilder(sourceAccount, {fee:100})
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
		dest = StellarSdk.Keypair.fromPublicKey(this.state.destPublic);
		server.loadAccount(escrow.publicKey())
			.then(function (escrowAccount) {
			const transaction2 = new StellarSdk.TransactionBuilder(escrowAccount, {fee:100})
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
		const t_escrowsecretkey = "";
		if (typeof event.target.value === 'string') {
			const t_escrowsecretkey = event.target.value;
			if (t_escrowsecretkey.length==56) {
				this.setState({escrowsecretkey: t_escrowsecretkey});
				escrow = StellarSdk.Keypair.fromSecret(t_escrowsecretkey);
				this.setState({escrowpublickey: escrow.publicKey()});
			};
		}
	}
	
  render() {
	return (
    <div className="App">
	  <div>
		Source operations
	  </div>
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
		<input type="text" name="name" 
			style={{width: "600px"}} 
			placeholder = "Enter here new escrow secret key"
			onChange={this.handleInputChange} />
	  </div>
	  <div>
		<button onClick={this.Payment}>Payment (transaction N 5)</button>
	  </div>
	  <div>
		Payment transaction hash: {this.state.paymentInfoKey}
	  </div>
	  <br/>
	  <div>
		Escrow operations
	  </div>
	  <div>
		Destination public key: {this.state.destPublic}
	  </div>
	  <div>
		<button onClick={this.EnablingMultiSig}>Enabling Multi-sig (transaction N 2)</button>
	  </div>
	  
    </div>
	)};
}

