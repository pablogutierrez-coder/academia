import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getDataProvider } from "../src/data-provider.ts";

const environment=globalThis.process.env;

describe("selección del proveedor de datos",()=>{
  const originalDemo=environment.DEMO_MODE;
  const originalProvider=environment.DATA_PROVIDER;

  afterEach(()=>{
    if(originalDemo===undefined) delete environment.DEMO_MODE;
    else environment.DEMO_MODE=originalDemo;
    if(originalProvider===undefined) delete environment.DATA_PROVIDER;
    else environment.DATA_PROVIDER=originalProvider;
  });

  it("prioriza el modo de demostración",()=>{
    environment.DEMO_MODE="true";
    environment.DATA_PROVIDER="firebase";
    assert.equal(getDataProvider(),"mock");
  });

  it("mantiene Prisma como valor predeterminado",()=>{
    delete environment.DEMO_MODE;
    delete environment.DATA_PROVIDER;
    assert.equal(getDataProvider(),"prisma");
  });

  it("habilita Firebase explícitamente",()=>{
    environment.DEMO_MODE="false";
    environment.DATA_PROVIDER="firebase";
    assert.equal(getDataProvider(),"firebase");
  });

  it("rechaza proveedores desconocidos",()=>{
    environment.DEMO_MODE="false";
    environment.DATA_PROVIDER="desconocido";
    assert.throws(()=>getDataProvider(),/DATA_PROVIDER no válido/);
  });
});
