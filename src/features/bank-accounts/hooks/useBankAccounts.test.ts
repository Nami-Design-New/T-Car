import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BankAccount } from "../model";

const {
  getBankAccountsAction,
  addBankAccountAction,
  updateBankAccountAction,
  deleteBankAccountAction,
} = vi.hoisted(() => ({
  getBankAccountsAction: vi.fn(),
  addBankAccountAction: vi.fn(),
  updateBankAccountAction: vi.fn(),
  deleteBankAccountAction: vi.fn(),
}));

vi.mock("../actions", () => ({
  getBankAccountsAction,
  addBankAccountAction,
  updateBankAccountAction,
  deleteBankAccountAction,
}));

import { useBankAccounts } from "./useBankAccounts";

const existing: BankAccount = {
  id: "5",
  bankId: "2",
  bankName: "Bank Albilad",
  iban: "SA0380000000608010167519",
  maskedNumber: "16 75 19",
};

const other: BankAccount = {
  ...existing,
  id: "6",
  iban: "SA4420000001234567123456",
  maskedNumber: "12 34 56",
};

beforeEach(() => {
  vi.clearAllMocks();
  getBankAccountsAction.mockResolvedValue({
    ok: true,
    data: { items: [existing], page: 1, lastPage: 1, total: 1 },
  });
});

async function renderLoaded() {
  const hook = renderHook(() => useBankAccounts());
  await waitFor(() =>
    expect(hook.result.current.accounts.items).toEqual([existing]),
  );
  return hook;
}

describe("useBankAccounts.add", () => {
  it("refuses an IBAN already in the loaded accounts without a request", async () => {
    const { result } = await renderLoaded();

    let outcome: Awaited<ReturnType<typeof result.current.add>> | undefined;
    await act(async () => {
      outcome = await result.current.add({
        bankId: "3",
        iban: "sa03 8000 0000 6080 1016 7519",
      });
    });

    expect(outcome).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        fieldErrors: { iban: "bankAccounts.duplicateIban" },
      },
    });
    expect(addBankAccountAction).not.toHaveBeenCalled();
  });

  it("adds a new IBAN, keeps the backend message, and reads page 1 again", async () => {
    const { result } = await renderLoaded();
    addBankAccountAction.mockResolvedValue({
      ok: true,
      data: { ...existing, id: "18", iban: "SA4420000001234567123456" },
      message: "Bank account added successfully.",
    });

    let outcome: Awaited<ReturnType<typeof result.current.add>> | undefined;
    await act(async () => {
      outcome = await result.current.add({
        bankId: "2",
        iban: "SA4420000001234567123456",
      });
    });

    expect(outcome).toEqual({
      ok: true,
      data: undefined,
      message: "Bank account added successfully.",
    });
    await waitFor(() => expect(getBankAccountsAction).toHaveBeenCalledTimes(2));
    expect(getBankAccountsAction).toHaveBeenLastCalledWith(1);
  });

  it("returns a failed add without reading the list again", async () => {
    const { result } = await renderLoaded();
    addBankAccountAction.mockResolvedValue({
      ok: false,
      error: { kind: "validation", serverMessage: "The bank field is required." },
    });

    let outcome: Awaited<ReturnType<typeof result.current.add>> | undefined;
    await act(async () => {
      outcome = await result.current.add({
        bankId: "2",
        iban: "SA4420000001234567123456",
      });
    });

    expect(outcome).toMatchObject({
      ok: false,
      error: { serverMessage: "The bank field is required." },
    });
    expect(getBankAccountsAction).toHaveBeenCalledTimes(1);
    expect(result.current.submitting).toBe(false);
  });
});

describe("useBankAccounts.update", () => {
  beforeEach(() => {
    getBankAccountsAction.mockResolvedValue({
      ok: true,
      data: { items: [existing, other], page: 1, lastPage: 1, total: 2 },
    });
    updateBankAccountAction.mockResolvedValue({
      ok: true,
      data: existing,
      message: "Bank account updated successfully.",
    });
  });

  async function renderBoth() {
    const hook = renderHook(() => useBankAccounts());
    await waitFor(() => expect(hook.result.current.accounts.items).toHaveLength(2));
    return hook;
  }

  it("lets an account keep its own IBAN (e.g. a bank change)", async () => {
    const { result } = await renderBoth();

    let outcome: Awaited<ReturnType<typeof result.current.update>> | undefined;
    await act(async () => {
      outcome = await result.current.update("5", { bankId: "3", iban: existing.iban });
    });

    expect(outcome).toMatchObject({
      ok: true,
      message: "Bank account updated successfully.",
    });
    expect(updateBankAccountAction).toHaveBeenCalledWith("5", {
      bankId: "3",
      iban: existing.iban,
    });
  });

  it("refuses another account's IBAN without a request", async () => {
    const { result } = await renderBoth();

    let outcome: Awaited<ReturnType<typeof result.current.update>> | undefined;
    await act(async () => {
      outcome = await result.current.update("5", { bankId: "2", iban: other.iban });
    });

    expect(outcome).toMatchObject({
      ok: false,
      error: { fieldErrors: { iban: "bankAccounts.duplicateIban" } },
    });
    expect(updateBankAccountAction).not.toHaveBeenCalled();
  });

  it("reads the list again when the account no longer exists", async () => {
    const { result } = await renderBoth();
    updateBankAccountAction.mockResolvedValue({
      ok: false,
      error: { kind: "not_found", code: "bankAccounts.notFound" },
    });

    await act(async () => {
      await result.current.update("5", { bankId: "2", iban: existing.iban });
    });
    await waitFor(() => expect(getBankAccountsAction).toHaveBeenCalledTimes(2));
  });
});

describe("useBankAccounts.remove", () => {
  it("keeps the backend message and reads page 1 again", async () => {
    const { result } = await renderLoaded();
    deleteBankAccountAction.mockResolvedValue({
      ok: true,
      data: null,
      message: "Bank account deleted successfully.",
    });

    let outcome: Awaited<ReturnType<typeof result.current.remove>> | undefined;
    await act(async () => {
      outcome = await result.current.remove("5");
    });

    expect(outcome).toEqual({
      ok: true,
      data: undefined,
      message: "Bank account deleted successfully.",
    });
    expect(deleteBankAccountAction).toHaveBeenCalledWith("5");
    await waitFor(() => expect(getBankAccountsAction).toHaveBeenCalledTimes(2));
  });
});

