import { describe, expect, test } from "vitest";
import { isSupabaseHttpsUrl, urlParaModelo } from "../midia";

describe("URL de mídia aceita pela função", () => {
  test("aceita objeto no Storage do Supabase", () => {
    expect(
      isSupabaseHttpsUrl("https://abc.supabase.co/storage/v1/object/sign/ia-uploads/u/a.jpg?token=1"),
    ).toBe(true);
  });

  test("recusa http e host que não é o Supabase", () => {
    expect(isSupabaseHttpsUrl("http://abc.supabase.co/storage/v1/object/public/ia-uploads/a.jpg")).toBe(false);
    expect(isSupabaseHttpsUrl("https://evil.example/planta.jpg")).toBe(false);
    expect(isSupabaseHttpsUrl("not a url")).toBe(false);
  });

  test("imagem https do Storage vai direto; base64 vira data-URL", async () => {
    const remota = "https://xyz.supabase.co/storage/v1/object/sign/ia-uploads/a.jpg";
    expect(await urlParaModelo({ url: remota })).toBe(remota);
    const data = await urlParaModelo({ b64: "/9j/abc", mime: "image/jpeg" });
    expect(data).toBe("data:image/jpeg;base64,/9j/abc");
    expect(await urlParaModelo({ url: "https://evil.example/a.jpg" })).toBeNull();
  });
});
