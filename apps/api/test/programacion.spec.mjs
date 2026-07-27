import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("reglas de programación",()=>{
  it("detecta matemáticamente un solape",()=>{
    const inicioExistente=new Date("2026-08-01T14:00:00Z");
    const finExistente=new Date("2026-08-01T16:00:00Z");
    const inicioNuevo=new Date("2026-08-01T15:00:00Z");
    const finNuevo=new Date("2026-08-01T17:00:00Z");
    assert.equal(inicioExistente<finNuevo && finExistente>inicioNuevo,true);
  });
});
