const { Connection, PublicKey, Transaction, SystemProgram, Keypair,clusterApiUrl } = require("@solana/web3.js");
const {
  TOKEN_PROGRAM_ID, getAssociatedTokenAddress,createMint,
  createAssociatedTokenAccountInstruction, createInitializeMintInstruction,MINT_SIZE,getMinimumBalanceForRentExemptMint,ASSOCIATED_TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const { TokenSwap,TokenSwapLayout,TOKEN_SWAP_PROGRAM_ID,CurveType } = require("@solana/spl-token-swap");
const bs58 = require('bs58')
 async function createPool(){
    try {
      const key = bs58.decode("ZKJN3WQug6NLhFcmHbXj6zkcciNSQfa5KoFtGWQnXkWP9VTEP7Qw2uy3HEjKpfJMEzCYsvdLXtTJQd658q1YFMH")
      const provider = new Keypair({ secretKey: key, publicKey: "28zKynbmq7FGeqKj5ZaYsGLtEqvD2h5bUuzNiixEQFRy" })
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const tokenA =new PublicKey("FBejEcYVZGR3xmiJThCR2P8yPX1FHwHiUFn9VgfxeR7q");
      const tokenB =new PublicKey("8T4v9q7LARBS9XVFzacJvG5QNupjY3JakNJ7w6c1aAxp");
      const transaction = new Transaction()
      const tokenSwapStateAccount = Keypair.generate()
      console.log(TokenSwap)
      const rent = TokenSwap.getMinBalanceRentForExemptTokenSwap(connection)
      //step1
      const tokenSwapStateAccountInstruction =  SystemProgram.createAccount({
        newAccountPubkey: tokenSwapStateAccount.publicKey,
        fromPubkey: provider.publicKey,
        lamports: rent,
        space: TokenSwapLayout.span,
        programId: TOKEN_SWAP_PROGRAM_ID
      })
      transaction.add(tokenSwapStateAccountInstruction)
      //step2
      const [swapAuthority, bump] = await PublicKey.findProgramAddress(
        [tokenSwapStateAccount.publicKey.toBuffer()],
        TOKEN_SWAP_PROGRAM_ID,
      )
      //step3
    
      const [tokenAAccountInstruction,tokenAAccountAddress] = createTokenAccount(tokenA,swapAuthority)
      const [tokenBAccountInstruction,tokenBAccountAddress] = createTokenAccount(tokenB,swapAuthority)

      transaction.add(tokenAAccountInstruction,tokenBAccountInstruction)


      //step4

      const LPpoolTokenMint = await create(
        swapAuthority
      )
      //create user lp account
      const[tokenAccountPoolInstruction,tokenAccountPool] = createTokenAccount(LPpoolTokenMint,provider.publicKey)
      transaction.add(tokenAccountPoolInstruction)
      const feeOwner = new PublicKey('HfoTxFR1Tm6kGmWgYWD6J7YHVy1UwqSULUGVLXkJqaKN')
//step5 
      let tokenFeeAccountAddress = await getAssociatedTokenAddress(
        LPpoolTokenMint, // mint
        feeOwner, // owner
        true // allow owner off curve
      )

      const tokenFeeAccountInstruction =  createAssociatedTokenAccountInstruction(
        provider.publicKey, // payer
        tokenFeeAccountAddress, // ata
        feeOwner, // owner
        LPpoolTokenMint // mint
      )
    
      transaction.add(tokenFeeAccountInstruction)
     // step6
      const createSwapInstruction = TokenSwap.createInitSwapInstruction(
        tokenSwapStateAccount,    // Token swap state account
        swapAuthority,        // Swap pool authority
        tokenAAccountAddress,         // Token A token account
        tokenBAccountAddress,         // Token B token account
        LPpoolTokenMint,        // Swap pool token mint
        tokenFeeAccountAddress,   // Token fee account
        tokenAccountPool.publicKey, // Swap pool token account
        TOKEN_PROGRAM_ID,   // Token Program ID
        TOKEN_SWAP_PROGRAM_ID,    // Token Swap Program ID
        0,              // Trade fee numerator
        10000,            // Trade fee denominator
        5,              // Owner trade fee numerator
        10000,            // Owner trade fee denominator
        0,              // Owner withdraw fee numerator
        0,              // Owner withdraw fee denominator
        20,             // Host fee numerator
        100,            // Host fee denominator
        CurveType.ConstantProduct   // Curve type
      )

     // transaction.add(createSwapInstruction)
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  }
  async function createTokenAccount(mint, owner) {
    try {
      const transaction = new Transaction();
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        owner,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      console.log(associatedToken.toString())
      try {
        let account = await connection.getAccountInfo(
          associatedToken,
        )
        console.log(account)
        if (!account) {
          try {
            const ins =  createAssociatedTokenAccountInstruction(
                provider.publicKey,
                associatedToken,
                owner,
                mint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )
              return (ins,associatedToken)
          } catch (error) { }
        }
      } catch (error) {
        if (
          error.message === "TokenAccountNotFoundError" ||
          error.message === "TokenInvalidAccountOwnerError"
        ) {
          try {
             const ins=  createAssociatedTokenAccountInstruction(
                provider.publicKey,
                associatedToken,
                owner,
                mint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )
              return (ins,associatedToken)
          } catch (error) { }
        } else {
          throw error
        }
      }

      return associatedToken;
    } catch (error) {
      console.log(error)
    }
  }

  async function create(authority) {
    // console.log(connection)
    if (provider) {
      try {
        const mint = Keypair.generate();
        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: provider.publicKey,
            newAccountPubkey: mint.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
          }),
          createInitializeMintInstruction(
            mint.publicKey,
            2,
            authority,
            authority,
            TOKEN_PROGRAM_ID
          )
        );
        let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = provider.publicKey
        console.log(transaction)
        if (transaction) {
          let signed = await provider.signTransaction(transaction);
          signed.partialSign(mint);
          let signature = await connection.sendRawTransaction(signed.serialize());
          console.log(signature)
        }
        return mint.publicKey
      } catch (error) {
        console.log(error)
      }
    }
  }
createPool()