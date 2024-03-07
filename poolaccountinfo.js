const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    clusterApiUrl,
    sendAndConfirmTransaction,
    PublicKey,
} = require("@solana/web3.js");
const { TokenSwap,TokenSwapLayout,TOKEN_SWAP_PROGRAM_ID,CurveType } = require("@solana/spl-token-swap");
const poolPublicKey = new PublicKey("BR53RoF3SybB3QEYDJXkLrQpoveRWGdvH2FBWt79dUN4")
const mint = new PublicKey("111113BcqPNhoJmv38M21RgzvwYwHY6p9xDBTTYfLb");
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
connection.getParsedAccountInfo(poolPublicKey).then(accountInfo => {
   let account = TokenSwapLayout.decode(accountInfo.value.data);
   if(account.mintA.toString()===mint.toString())
   {console.log(account.tokenAccountA.toString(),"a")}
   else{
    console.log(account.tokenAccountB.toString(),"b")
   }
});