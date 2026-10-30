import { readFileSync } from "node:fs";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

describe("fighter-search data minimisation", () => {
  it("returns only name, role, country and profileUrl without fetching images", async () => {
    const html = `<tr><td><img src="cache/img/persons/test.jpg"></td>
      <td><a href="cisse-cheick.a123.html">Cisse, Cheick</a> (competitor)</td>
      <td><img src="male.png"></td><td>unused</td><td>Côte d'Ivoire</td>
      <td>2009-01-01</td></tr>`;
    const fetchSource = vi.fn().mockResolvedValue(new Response(html));
    let handler: ((request: Request) => Promise<Response>) | undefined;
    const source = readFileSync("supabase/functions/fighter-search/index.ts", "utf8")
      .replace(/^import .*;\s*$/gm, "");
    const compiled = transpileModule(source, {
      compilerOptions: { module: ModuleKind.None, target: ScriptTarget.ES2022 },
    }).outputText;
    new Function("Deno", "createClient", "z", "corsHeaders", "fetch", compiled)(
      { env: { get: () => "test-value" }, serve: (fn: typeof handler) => { handler = fn; } },
      () => ({ auth: { getUser: async () => ({ data: { user: { id: "test-user" } } }) } }),
      z, {}, fetchSource,
    );
    if (!handler) throw new Error("Function handler was not registered");
    const response = await handler(new Request("https://example.test/fighter-search", {
      method: "POST",
      headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" },
      body: JSON.stringify({ firstname: "Cheick", surname: "Cisse", nation: "384" }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ results: [{
      name: "Cisse, Cheick", role: "competitor", country: "Côte d'Ivoire",
      profileUrl: "https://www.taekwondodata.com/cisse-cheick.a123.html",
    }] });
    expect(fetchSource).toHaveBeenCalledTimes(1);
    expect(fetchSource.mock.calls[0][0]).toBe("https://www.taekwondodata.com/person_searchresult.html");
  });
});