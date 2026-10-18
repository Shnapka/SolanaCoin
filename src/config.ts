// Общие настройки и помощники для всех скриптов PETC.
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import bs58 from "bs58";

dotenv.config();

// ─── Монета проекта PetNFT ───
// PETC — это PetCoin, внутриигровая валюта PetNFT: её зарабатывают
// в мини-играх с питомцем и тратят в магазине (еда, тренировки, предметы).
export const TOKEN_NAME = "PetCoin";
export const TOKEN_SYMBOL = "PETC";
export const DECIMALS = 6; // 1 PETC = 1 000 000 минимальных единиц

// Программа Memo: записывает текст в транзакцию — его видно в Explorer.
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const connection = new Connection(RPC_URL, "confirmed");

/** Человеческое число PETC → целое число минимальных единиц (bigint, без потерь точности). */
export const toRaw = (amount: number): bigint => BigInt(Math.round(amount * 10 ** DECIMALS));
/** Минимальные единицы → PETC. */
export const fromRaw = (raw: bigint): number => Number(raw) / 10 ** DECIMALS;

export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAddress = (addr: string) => `https://explorer.solana.com/address/${addr}?cluster=devnet`;

/** Кошелёк, который платит комиссии и владеет монетой. Ключ берём только из .env и никогда не печатаем. */
export function loadPayer(): Keypair {
  const secret = process.env.SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("SECRET_KEY не задан. Создайте файл .env и вставьте приватный ключ devnet-кошелька (см. README).");
  }
  try {
    return Keypair.fromSecretKey(bs58.decode(secret));
  } catch {
    throw new Error("SECRET_KEY не похож на приватный ключ Phantom (base58, ~88 символов).");
  }
}

/** Читает публичный адрес из переменной окружения; пустые пропускает. */
export function optionalPublicKey(name: string): PublicKey | null {
  const value = process.env[name]?.trim();
  if (!value) return null;
  try {
    return new PublicKey(value);
  } catch {
    throw new Error(`${name} = "${value}" — это не адрес Solana.`);
  }
}
