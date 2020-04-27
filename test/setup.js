import {ensureMocksReset} from '@shopify/jest-dom-mocks'
// This file is for setting up Jest test environments
afterEach(() => {
  jest.clearAllMocks()
  ensureMocksReset()
})
