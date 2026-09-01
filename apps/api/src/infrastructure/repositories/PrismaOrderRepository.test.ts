import { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentInput } from "@domain/entities/Order";
import { PrismaOrderRepository } from "./PrismaOrderRepository";

// The stored row the mocked Prisma client echoes back. Only the fields toPaymentDomain reads
// matter here; Decimal columns come back as something Number() can widen, which is all the
// mapper does with them.
const storedRow = {
  id: "payment-1",
  orderId: "order-1",
  date: new Date("2026-01-05"),
  amount: 900,
  method: "Transferencia",
  feePct: 3.5,
  note: "Seña",
};

function buildPrisma() {
  const update = vi.fn(async () => storedRow);
  const create = vi.fn(async () => storedRow);
  return {
    prisma: { payment: { update, create } } as unknown as PrismaClient,
    update,
    create,
  };
}

// The data object the repository handed to Prisma on the single update call.
function updateData(update: ReturnType<typeof buildPrisma>["update"]): Record<string, unknown> {
  expect(update).toHaveBeenCalledTimes(1);
  return (update.mock.calls[0] as unknown as [{ data: Record<string, unknown> }])[0].data;
}

describe("PrismaOrderRepository.updatePayment", () => {
  let mocks: ReturnType<typeof buildPrisma>;
  let repository: PrismaOrderRepository;

  beforeEach(() => {
    mocks = buildPrisma();
    repository = new PrismaOrderRepository(mocks.prisma);
  });

  // The regression this guards: the edit-payment modal only sends amount/method/note, so an
  // absent feePct used to be coalesced to null and wiped a fee the user never saw on screen.
  it("leaves feePct out of the update when the caller doesn't send it", async () => {
    await repository.updatePayment("payment-1", { amount: 900, method: "Transferencia" });

    const data = updateData(mocks.update);
    expect(data).not.toHaveProperty("feePct");
  });

  it("leaves note out of the update when the caller doesn't send it", async () => {
    await repository.updatePayment("payment-1", { amount: 900, method: "Transferencia" });

    const data = updateData(mocks.update);
    expect(data).not.toHaveProperty("note");
  });

  it("still writes amount and method, which are always required", async () => {
    await repository.updatePayment("payment-1", { amount: 900, method: "Transferencia" });

    expect(updateData(mocks.update)).toEqual({ amount: 900, method: "Transferencia" });
  });

  // Omitting a key means "don't touch it", so clearing a value has to stay possible — an
  // explicit null is the way to say it.
  it("clears feePct when the caller sends an explicit null", async () => {
    await repository.updatePayment("payment-1", {
      amount: 900,
      method: "Transferencia",
      feePct: null,
    });

    expect(updateData(mocks.update)).toMatchObject({ feePct: null });
  });

  it("clears note when the caller sends an explicit null", async () => {
    await repository.updatePayment("payment-1", {
      amount: 900,
      method: "Transferencia",
      note: null,
    });

    expect(updateData(mocks.update)).toMatchObject({ note: null });
  });

  it("writes feePct and note through when the caller sends real values", async () => {
    const input: PaymentInput = {
      amount: 900,
      method: "Transferencia",
      feePct: 3.5,
      note: "Seña",
    };
    await repository.updatePayment("payment-1", input);

    expect(updateData(mocks.update)).toEqual(input);
  });

  it("targets the payment by id", async () => {
    await repository.updatePayment("payment-1", { amount: 900, method: "Transferencia" });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "payment-1" } })
    );
  });

  it("maps the stored row back to a domain Payment", async () => {
    const payment = await repository.updatePayment("payment-1", {
      amount: 900,
      method: "Transferencia",
    });

    expect(payment).toEqual({
      id: "payment-1",
      orderId: "order-1",
      date: new Date("2026-01-05"),
      amount: 900,
      method: "Transferencia",
      feePct: 3.5,
      note: "Seña",
    });
  });
});

describe("PrismaOrderRepository.addPayment", () => {
  // A create has no previous value to preserve, so the column has to be given something —
  // null is correct here, unlike in updatePayment.
  it("coalesces an absent feePct and note to null, since there's no existing row", async () => {
    const mocks = buildPrisma();
    const repository = new PrismaOrderRepository(mocks.prisma);

    await repository.addPayment("order-1", { amount: 900, method: "Transferencia" });

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        orderId: "order-1",
        amount: 900,
        method: "Transferencia",
        feePct: null,
        note: null,
      },
    });
  });
});
