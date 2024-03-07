const { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction,TransactionInstruction  } = require("@solana/web3.js");
const bs58 = require('bs58')
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const recipient = new PublicKey('28zKynbmq7FGeqKj5ZaYsGLtEqvD2h5bUuzNiixEQFRy');
const key = bs58.decode("ZKJN3WQug6NLhFcmHbXj6zkcciNSQfa5KoFtGWQnXkWP9VTEP7Qw2uy3HEjKpfJMEzCYsvdLXtTJQd658q1YFMH")
const payer = new Keypair({ secretKey: key, publicKey: "28zKynbmq7FGeqKj5ZaYsGLtEqvD2h5bUuzNiixEQFRy" })
const programId = new PublicKey('ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa')
const pingProgramDataId =  new PublicKey('Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod')
const transaction = new Transaction()
const instruction = new TransactionInstruction({
    keys: [
      {
        pubkey: pingProgramDataId,
        isSigner: false,
        isWritable: true
      },
    ],
    programId
  })
  
  transaction.add(instruction)

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  )
  
  console.log(`✅ Transaction completed! Signature is ${signature}`)
  const ourMetadata = {
    name: "Test", 
    symbol: "MT",
    uri: "https://raw.githubusercontent.com/loopcreativeandy/video-tutorial-resources/main/metadataUpdate/metadata.json",
}
    const onChainData = {
        ...ourMetadata,
        sellerFeeBasisPoints: 500,
        creators: null,
        collection: null,
        uses: null,
    }
    const accounts = {
        mint: new PublicKey("8T4v9q7LARBS9XVFzacJvG5QNupjY3JakNJ7w6c1aAxp"),
        splTokenProgram: TOKEN_2022_PROGRAM_ID
    }
    const data = {
        ...onChainData,
        isMutable: true,
        discriminator: 0,
        tokenStandard: TokenStandard.Fungible,
        collectionDetails: null,
        createV1Discriminator: 0,
        primarySaleHappened: true,
        decimals: 2,
    }
    const txid = await createV1(umi, {...accounts, ...data}).sendAndConfirm(umi);
    console.log(bs58.encode(txid.signature))