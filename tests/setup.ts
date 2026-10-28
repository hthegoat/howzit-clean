// Nitro auto-imports h3 helpers into server routes. Tests import the route
// file directly, so provide the same globals here.
import * as h3 from 'h3'

Object.assign(globalThis, {
  defineEventHandler: h3.defineEventHandler,
  getHeader: h3.getHeader,
  setResponseHeader: h3.setResponseHeader,
  setResponseStatus: h3.setResponseStatus,
  readRawBody: h3.readRawBody,
})
