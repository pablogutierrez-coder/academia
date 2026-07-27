import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "dotenv";
import { applicationDefault } from "firebase-admin/app";

config({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  quiet: true,
});

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error("FIREBASE_PROJECT_ID no está configurado.");

const rules = await readFile(
  resolve(process.cwd(), "../../firebase/firestore.rules"),
  "utf8",
);
const indexConfig = JSON.parse(
  await readFile(
    resolve(process.cwd(), "../../firebase/firestore.indexes.json"),
    "utf8",
  ),
);
const credential = applicationDefault();
const { access_token: accessToken } = await credential.getAccessToken();
const headers = {
  authorization: `Bearer ${accessToken}`,
  "content-type": "application/json",
};

const rulesetResponse = await fetch(
  `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: { files: [{ name: "firestore.rules", content: rules }] },
    }),
  },
);

if (!rulesetResponse.ok) {
  throw new Error(`No se pudo crear el ruleset (${rulesetResponse.status}).`);
}

const ruleset = await rulesetResponse.json();
const releaseName = `projects/${projectId}/releases/cloud.firestore`;
const releaseResponse = await fetch(
  `https://firebaserules.googleapis.com/v1/${releaseName}`,
  {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      name: releaseName,
      release: { name: releaseName, rulesetName: ruleset.name },
    }),
  },
);

if (!releaseResponse.ok) {
  const detail = await releaseResponse.text();
  throw new Error(
    `No se pudo publicar el ruleset (${releaseResponse.status}): ${detail}`,
  );
}

let indexesCreated = 0;
let indexesPending = 0;
for (const index of indexConfig.indexes ?? []) {
  const collectionGroup = encodeURIComponent(index.collectionGroup);
  const baseUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/collectionGroups/${collectionGroup}/indexes`;
  const listResponse = await fetch(baseUrl, { headers });
  if (!listResponse.ok) {
    throw new Error(`No se pudieron consultar los índices (${listResponse.status}).`);
  }

  const existing = (await listResponse.json()).indexes ?? [];
  const requestedFields = JSON.stringify(index.fields);
  const alreadyExists = existing.some((candidate) => {
    const comparable = (candidate.fields ?? []).filter(
      (field) => field.fieldPath !== "__name__",
    );
    return (
      candidate.queryScope === index.queryScope &&
      JSON.stringify(comparable) === requestedFields
    );
  });

  if (alreadyExists) continue;
  const createResponse = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      queryScope: index.queryScope,
      fields: index.fields,
    }),
  });
  if (!createResponse.ok) {
    const detail = await createResponse.text();
    if (createResponse.status === 403) {
      indexesPending += 1;
      console.warn(
        `Índice pendiente para ${index.collectionGroup}: ` +
          "la cuenta de servicio no tiene permiso para administrar índices.",
      );
      continue;
    }
    throw new Error(
      `No se pudo crear el índice de ${index.collectionGroup} ` +
        `(${createResponse.status}): ${detail}`,
    );
  }
  indexesCreated += 1;
}

console.log(
  `Reglas publicadas e índices verificados en ${projectId} ` +
    `(${indexesCreated} nuevos, ${indexesPending} pendientes por IAM).`,
);
