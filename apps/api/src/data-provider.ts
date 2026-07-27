export type DataProvider = "mock" | "prisma" | "firebase";

export function getDataProvider(): DataProvider {
  if (process.env.DEMO_MODE === "true") return "mock";
  const provider = (process.env.DATA_PROVIDER ?? "prisma").toLowerCase();
  if (provider === "prisma" || provider === "firebase") return provider;
  throw new Error(`DATA_PROVIDER no válido: ${provider}. Usa "prisma" o "firebase".`);
}
