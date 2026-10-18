// Метаданные монеты: имя, символ и логотип, чтобы кошельки (Phantom и др.)
// показывали PETC с названием и картинкой, а не как «неизвестный токен».
// Используется программа Metaplex Token Metadata.
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import {
  createMetadataAccountV3,
  fetchMetadataFromSeeds,
  mplTokenMetadata,
  updateMetadataAccountV2,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import { RPC_URL, TOKEN_NAME, TOKEN_SYMBOL, explorerAddress, explorerTx, loadPayer, optionalPublicKey } from "./config";

// JSON с описанием и ссылкой на логотип лежит в этом же репозитории (папка assets).
const METADATA_URI = "https://raw.githubusercontent.com/Shnapka/SolanaCoin/main/assets/petc.json";

async function main() {
  const mintKey = optionalPublicKey("MINT_ADDRESS");
  if (!mintKey) throw new Error("Укажите MINT_ADDRESS в .env (его печатает npm run mint).");

  const payer = loadPayer();
  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(payer.secretKey)));

  const mint = publicKey(mintKey.toBase58());
  const data = {
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    uri: METADATA_URI,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  // Если метаданные уже есть — обновляем, иначе создаём.
  const existing = await fetchMetadataFromSeeds(umi, { mint }).catch(() => null);
  const builder = existing
    ? updateMetadataAccountV2(umi, { metadata: existing.publicKey, data, isMutable: true })
    : createMetadataAccountV3(umi, { mint, mintAuthority: umi.identity, data, isMutable: true, collectionDetails: null });

  console.log(existing ? "Обновляем метаданные PETC..." : "Создаём метаданные PETC...");
  const { signature } = await builder.sendAndConfirm(umi);
  const sig = bs58.encode(signature);

  console.log("Готово:", `${TOKEN_NAME} (${TOKEN_SYMBOL})`);
  console.log("Транзакция:", explorerTx(sig));
  console.log("Монета:", explorerAddress(mintKey.toBase58()));
}

main().catch((err) => {
  console.error("Ошибка:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
