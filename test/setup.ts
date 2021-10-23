// This file is for setting up Jest test environments
import "@testing-library/jest-dom/extend-expect";
import { ensureMocksReset } from "@shopify/jest-dom-mocks";

// This file is for setting up Jest test environments
afterEach(() => {
  jest.clearAllMocks();
  ensureMocksReset();
});
