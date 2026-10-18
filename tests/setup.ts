import { vi } from "vitest";
vi.mock("server-only", () => ({}));
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(cleanup);
