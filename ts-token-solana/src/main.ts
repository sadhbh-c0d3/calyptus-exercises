import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { userKeypair } from "./helpers";

import { createV1, TokenStandard, mintV1 } from "@metaplex-foundation/mpl-token-metadata";
import { createFungible } from "@metaplex-foundation/mpl-token-metadata";

(async () =>
{
    // Create Umi that will be connected to Solana's devnet
    const umi = createUmi('https://api.devnet.solana.com');

    // We need to convert key-pair produced by solana-keygen into EDDSA required by Metaplex
    const keypair = umi.eddsa.createKeypairFromSecretKey(userKeypair.secretKey);

    // We install plug-ins into Umi, which are our Keypair and metadata program
    umi.use(keypairIdentity(keypair))
        .use(mplTokenMetadata())

    // This is some example metadata we can use.
    // There is no restriction as to how many tokens re-use same metadata.
    const metadata = {
        name: "Solana Gold",
        symbol: "GOLDSOL",
        uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
    };

    // This will take Keypair and turn it into KeypairSigner, i.e. Signer that is aware of secretKey.
    // Note though it is publicKey that is used for signing.
    const mint = generateSigner(umi);

    // Option 1. This one is more general one
    async function createMyTokenV1() {
        await createV1(umi, {
            mint,
            authority: umi.identity,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            sellerFeeBasisPoints: percentAmount(0),
            decimals: 9,
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi)
    }

    // Option.2 This one will just use TokenStandard.Fungible
    async function createMyFungibleToken() {
        await createFungible(umi, {
            mint,
            authority: umi.identity,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            sellerFeeBasisPoints: percentAmount(0),
            decimals: 9,
        }).sendAndConfirm(umi)
    }

    // Not entirely sure why minting needs to re-specify TokenStandard.Fungible
    async function mintMyTokenV1() {
        await mintV1(umi, {
            mint: mint.publicKey,
            authority: umi.identity,
            amount: 10_000,
            tokenOwner: umi.identity.publicKey,
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi)
    }

    // Choose either Option 1 or 2 here
    //await createMyFungibleToken();
    await createMyTokenV1();

    console.log("Created my token");

    await mintMyTokenV1();

    console.log("Minted token");

})()
// We just catch all errors with this
.catch(err => console.log("Error: %s", err));
