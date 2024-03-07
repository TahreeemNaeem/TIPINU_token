const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    clusterApiUrl,
    PublicKey,
    sendAndConfirmTransaction,
} = require("@solana/web3.js");;
const {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createAccount,
    getOrCreateAssociatedTokenAccount,
    getAssociatedTokenAddress,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    getMintLen,
    transfer,
    getTransferFeeAmount,
    unpackAccount,
    withdrawWithheldTokensFromAccounts,
    transferChecked,
    MintLayout
} = require("@solana/spl-token");
const bs58 = require('bs58')

const LIQUIDITY_POOL_ADDRESS = new PublicKey("");
const addressuser = new PublicKey("")
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const mint = new PublicKey("");
const key = bs58.decode("")
const payer = new Keypair({ secretKey: key, publicKey: "" })
const decimals = 4

async function distributeFees() {
    console.log("Running fee script..")
    const sender = await getAssociatedTokenAddress(
        mint,
        payer.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
    )
    const allacounts = await getAllAccounts()
    const { accountsToWithdrawFrom, amounttowithdraw } = await accountstowithdrawFee(allacounts);
    if (accountsToWithdrawFrom && accountsToWithdrawFrom.length > 0) {
        transactionSignature = await withdrawWithheldTokensFromAccounts(
            connection,
            payer,
            mint,
            sender,
            payer,
            [],
            accountsToWithdrawFrom,
            null,
            TOKEN_2022_PROGRAM_ID
        );

        console.log(transactionSignature, "Withdraw transfer fee to sender account.");
    }

    const reflectionsToTokenHolders = amounttowithdraw * 0.7;
    const reflectionsToSpecificWallet = amounttowithdraw * 0.2;
    const addToLiquidityPool = amounttowithdraw * 0.05;
    const reflectionsToNFTHolders = amounttowithdraw * 0.05;

    await distributeReflections(sender,reflectionsToTokenHolders, allacounts);
    await distributeNFTReflections(sender,reflectionsToNFTHolders);
    await sendSPLTokensToPool(sender, addToLiquidityPool);
    await sendSPLTokensToAddress(sender,addressuser, reflectionsToSpecificWallet);
}
async function sendSPLTokensToAddress(sender,receiverPublickKey, amount) {
    const [ins, receiver] = await createTokenAccount(mint, receiverPublickKey);
    if (ins) {
        let transaction = new Transaction().add(
            ins
        );
        transactionSignature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [payer]
        );
        console.log(transactionSignature, "Created token account.");
    }
    const transferAmount = BigInt(parseInt(amount));
    transactionSignature = await transferChecked(
        connection,
        payer,
        sender,
        mint,
        receiver,
        payer.publicKey,
        transferAmount,
        4,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log(transactionSignature, `Transfered ${parseInt(transferAmount) / 10 ** 4} to wallet`);
}
async function sendSPLTokensToPool(sender, amount) {
    let destinationAddress = await getPoolTokenAccount()
    const transactionSignature = await transferChecked(
        connection,
        payer,
        sender,
        mint,
        destinationAddress,
        payer.publicKey,
        parseInt(amount),
        4,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log(transactionSignature, `Transfered ${parseInt(amount) / 10 ** 4} to pool`)
}
async function distributeReflections(sender ,amount, allAccounts) {
    const accounts = await getAllAccountsInfo(allAccounts)
    for (const account of accounts) {
        const transferAmount = BigInt(parseInt(amount * account.percent));
        transactionSignature = await transferChecked(
            connection,
            payer,
            sender,
            mint,
            account.address,
            payer.publicKey,
            transferAmount,
            4,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID
        );
        console.log(transactionSignature, `Transfered ${parseInt(transferAmount) / 10 ** 4} to token holder`)
    }
}

async function distributeNFTReflections(sender,amount) {
    const allHolders = await getNFTSByCreator();
    const transferAmount = BigInt(parseInt(amount/allHolders.length));
    for (const account of allHolders) {
        const [ins, receiver] = await createTokenAccount(mint, new PublicKey(account.owner));
        if (ins) {
            transaction = new Transaction().add(
                ins
            );
            let transaction = new Transaction().add(
                createAccountInstruction,
            );
            transactionSignature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [payer]
                // { skipPreflight: true }
            );
            console.log(transactionSignature, "nft");
        }
        transactionSignature = await transferChecked(
            connection,
            payer,
            sender,
            mint,
            receiver,
            payer.publicKey,
            transferAmount,
            4,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID
        );
        console.log(transactionSignature, `Transfered ${parseInt(transferAmount) / 10 ** 4} to NFT holder`);
    }
}
async function getAllAccounts() {
    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
        commitment: "confirmed",
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: mint.toString(), // Mint Account address
                },
            },
        ],
    });
    return allAccounts;
}
async function accountstowithdrawFee(allAccounts) {
    const accountsToWithdrawFrom = [];
    let amounttowithdraw = 0
    for (const accountInfo of allAccounts) {
        const account = unpackAccount(
            accountInfo.pubkey,
            accountInfo.account,
            TOKEN_2022_PROGRAM_ID
        );
        const transferFeeAmount = getTransferFeeAmount(account);
        if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > 0) {
            // console.log(transferFeeAmount)
            amounttowithdraw += parseInt(transferFeeAmount.withheldAmount)
            accountsToWithdrawFrom.push(accountInfo.pubkey);
        }
    }
    return { accountsToWithdrawFrom, amounttowithdraw };
}
async function getAllAccountsInfo(allAccounts) {
    const accounts = [];
    const acc = MintLayout.decode((await connection.getAccountInfo(mint)).data);
    const ts = (acc.supply.toString())
    for (const accountInfo of allAccounts) {
        const account = unpackAccount(
            accountInfo.pubkey,
            accountInfo.account,
            TOKEN_2022_PROGRAM_ID
        );
        accounts.push({ ...account, percent: (parseInt(account.amount) / ts) })
    }
    return accounts;
}

distributeFees().catch(console.error);

async function createTokenAccount(mint, owner) {
    try {
        const associatedToken = await getAssociatedTokenAddress(
            mint,
            owner,
            true,
            TOKEN_2022_PROGRAM_ID
        );
        try {
            let account = await connection.getAccountInfo(
                associatedToken,
            )
            if (!account) {
                try {
                    const ins = createAssociatedTokenAccountInstruction(
                        payer.publicKey,
                        associatedToken,
                        owner,
                        mint,
                        TOKEN_2022_PROGRAM_ID
                    )
                    return [ins, associatedToken]
                } catch (error) { }
            }
        } catch (error) {
            if (
                error.message === "TokenAccountNotFoundError" ||
                error.message === "TokenInvalidAccountOwnerError"
            ) {
                try {
                    const ins = createAssociatedTokenAccountInstruction(
                        payer.publicKey,
                        associatedToken,
                        owner,
                        mint,
                        TOKEN_2022_PROGRAM_ID
                    )

                    return [ins, associatedToken]
                } catch (error) { }
            } else {
                throw error
            }
        }


        return [null, associatedToken];
    } catch (error) {
        console.log(error)
    }
}

async function getPoolTokenAccount() {
    const accountInfo = await connection.getParsedAccountInfo(LIQUIDITY_POOL_ADDRESS)
    let account = TokenSwapLayout.decode(accountInfo.value.data);
    if (account.mintA.toString() === mint.toString()){ 
        return account.tokenAccountA 
    }
    else {
        return account.tokenAccountB
    }
}
const url = `https://mainnet.helius-rpc.com/?api-key=ff3c6e4e-511d-4b13-9ed7-7beab8f250e5`

const getNFTSByCreator = async () => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAssetsByCreator',
      params: {
        creatorAddress: '2tURYHc9JqntFh14kRuoJNrwbenQSJ5fErAuDUUzpudr',
        onlyVerified: true,
        page: 1,
        limit: 1000
      },
    }),
  });
  const { result } = await response.json();
  let holders = []
  for(const item of result.items){
     holders.push({nftid:item.id,owner:item.ownership.owner})
  }
  return holders
};