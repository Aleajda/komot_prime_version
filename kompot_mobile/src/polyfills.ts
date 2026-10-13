import { TextEncoder as PolyTextEncoder, TextDecoder as PolyTextDecoder } from "text-encoding"

const g = globalThis as Record<string, unknown>

if (typeof g.TextEncoder === "undefined") {
  g.TextEncoder = PolyTextEncoder
}

if (typeof g.TextDecoder === "undefined") {
  g.TextDecoder = PolyTextDecoder
}
