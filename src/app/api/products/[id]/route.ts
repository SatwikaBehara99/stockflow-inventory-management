import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Multi-tenant scoped query
    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching product details." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify product belongs to current tenant
    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found or access denied." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const {
      name,
      sku,
      description,
      quantityOnHand,
      costPrice,
      sellingPrice,
      lowStockThreshold,
    } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    if (!sku || typeof sku !== "string" || sku.trim().length === 0) {
      return NextResponse.json(
        { error: "SKU is required." },
        { status: 400 }
      );
    }

    const sanitizedSku = sku.trim().toUpperCase();

    let qty = existing.quantityOnHand;
    if (quantityOnHand !== undefined && quantityOnHand !== null && quantityOnHand !== "") {
      const parsedQty = Number(quantityOnHand);
      if (!Number.isInteger(parsedQty) || parsedQty < 0) {
        return NextResponse.json(
          { error: "Quantity on hand must be a non-negative integer." },
          { status: 400 }
        );
      }
      qty = parsedQty;
    }

    let parsedCost: number | null = existing.costPrice ? Number(existing.costPrice) : null;
    if (costPrice !== undefined) {
      if (costPrice === null || costPrice === "") {
        parsedCost = null;
      } else {
        const num = Number(costPrice);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { error: "Cost price must be a valid non-negative number." },
            { status: 400 }
          );
        }
        parsedCost = num;
      }
    }

    let parsedSelling: number | null = existing.sellingPrice ? Number(existing.sellingPrice) : null;
    if (sellingPrice !== undefined) {
      if (sellingPrice === null || sellingPrice === "") {
        parsedSelling = null;
      } else {
        const num = Number(sellingPrice);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { error: "Selling price must be a valid non-negative number." },
            { status: 400 }
          );
        }
        parsedSelling = num;
      }
    }

    let parsedThreshold: number | null = existing.lowStockThreshold ?? 10;
    if (lowStockThreshold !== undefined) {
      if (lowStockThreshold === null || lowStockThreshold === "") {
        parsedThreshold = null;
      } else {
        const num = Number(lowStockThreshold);
        if (!Number.isInteger(num) || num < 0) {
          return NextResponse.json(
            { error: "Low stock threshold must be a non-negative integer." },
            { status: 400 }
          );
        }
        parsedThreshold = num;
      }
    }

    // Check SKU uniqueness if changed
    if (sanitizedSku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: {
          organizationId_sku: {
            organizationId: session.organizationId,
            sku: sanitizedSku,
          },
        },
      });

      if (duplicateSku && duplicateSku.id !== id) {
        return NextResponse.json(
          {
            error: `SKU "${sanitizedSku}" already exists in your organization.`,
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        sku: sanitizedSku,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        quantityOnHand: qty,
        costPrice: parsedCost,
        sellingPrice: parsedSelling,
        lowStockThreshold: parsedThreshold,
      },
    });

    return NextResponse.json(
      {
        success: true,
        product: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error updating product." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found or access denied." },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error deleting product." },
      { status: 500 }
    );
  }
}
