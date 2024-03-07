const {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    clusterApiUrl,
    sendAndConfirmTransaction,
} = require("@solana/web3.js");
const {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    getAssociatedTokenAddress,
    createInitializeTransferFeeConfigInstruction,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createInitializeMetadataPointerInstruction,
    TYPE_SIZE,
    LENGTH_SIZE
} = require("@solana/spl-token");
const {
    createInitializeInstruction,
    pack,
} = require("@solana/spl-token-metadata");
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');

const { createSignerFromKeypair ,signerIdentity } = require("@metaplex-foundation/umi");
const bs58 = require('bs58')

async function createToken() {
    const key = bs58.decode("ZKJN3WQug6NLhFcmHbXj6zkcciNSQfa5KoFtGWQnXkWP9VTEP7Qw2uy3HEjKpfJMEzCYsvdLXtTJQd658q1YFMH")
    const payer = new Keypair({ secretKey: key, publicKey: "28zKynbmq7FGeqKj5ZaYsGLtEqvD2h5bUuzNiixEQFRy" })
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const umi = createUmi(connection);
    const signer = createSignerFromKeypair(umi, payer)
    umi.use(signerIdentity(signer))
    let transaction = new Transaction();
    let transactionSignature;
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const decimals = 4;

    const mintAuthority = payer.publicKey;
    const updateAuthority = payer.publicKey;

    const feeBasisPoints = 500;
    const maxFee = BigInt(10000000);
    const metaData = {
        updateAuthority: updateAuthority,
        mint: mint,
        name: "TIPINU",
        symbol: "",
        uri: "",
        additionalMetadata: [["description", "Only Possible On Solana"]],
    };
    const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
    const metadataLen = pack(metaData).length;
    const mintLen = getMintLen([
        ExtensionType.TransferFeeConfig,
        ExtensionType.MetadataPointer,
    ]);
    const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataExtension + metadataLen
    );

    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
    });

    const initializeTransferFeeConfig =
        createInitializeTransferFeeConfigInstruction(
            mint,
            updateAuthority,
            updateAuthority,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
        );
    const initializeMetadataPointerInstruction =
        createInitializeMetadataPointerInstruction(
            mint,
            updateAuthority,
            mint,
            TOKEN_2022_PROGRAM_ID
        );
    const initializeMintInstruction = createInitializeMintInstruction(
        mint,
        decimals,
        mintAuthority,
        null,
        TOKEN_2022_PROGRAM_ID
    );
    const initializeMetadataInstruction = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: updateAuthority,
        mint: mint,
        mintAuthority: mintAuthority,
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.uri,
    });
    let ownerTokenAccount = await getAssociatedTokenAddress(
        mint,
        payer.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID

    )

    const createownerTokenAccount = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ownerTokenAccount,
        payer.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID
    )
    const mintInstruction = createMintToInstruction(
        mint,
        ownerTokenAccount,
        payer.publicKey,
        420000000 * 10 **decimals,
        [],
        TOKEN_2022_PROGRAM_ID)
    transaction = new Transaction().add(
        createAccountInstruction,
        initializeTransferFeeConfig,
        initializeMetadataPointerInstruction,
        initializeMintInstruction,
        initializeMetadataInstruction,
        createownerTokenAccount,
        mintInstruction
    );

    transactionSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mintKeypair]
    );

    console.log(transactionSignature);

}
createToken()
