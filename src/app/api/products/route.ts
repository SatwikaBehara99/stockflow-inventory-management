import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // 1. Independently verify the session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    // 2. Multi-tenant scoped query
    const where: Prisma.ProductWhereInput = {
      organizationId: session.organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // 3. Compute tenant summary metrics
    let totalQuantityOnHand = 0;
    let lowStockCount = 0;

    for (const p of products) {
      totalQuantityOnHand += p.quantityOnHand;
      const threshold = p.lowStockThreshold ?? 10;
      if (p.quantityOnHand <= threshold) {
        lowStockCount++;
      }
    }

    return NextResponse.json(
      {
        products,
        totalProducts: products.length,
        totalQuantityOnHand,
        lowStockCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching products." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Independently verify the session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
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

    // 2. Server-side validation
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

    let qty = 0;
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

    let parsedCost: number | null = null;
    if (costPrice !== undefined && costPrice !== null && costPrice !== "") {
      const num = Number(costPrice);
      if (isNaN(num) || num < 0) {
        return NextResponse.json(
          { error: "Cost price must be a valid non-negative number." },
          { status: 400 }
        );
      }
      parsedCost = num;
    }

    let parsedSelling: number | null = null;
    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== "") {
      const num = Number(sellingPrice);
      if (isNaN(num) || num < 0) {
        return NextResponse.json(
          { error: "Selling price must be a valid non-negative number." },
          { status: 400 }
        );
      }
      parsedSelling = num;
    }

    let parsedThreshold: number | null = 10;
    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== "") {
      const num = Number(lowStockThreshold);
      if (!Number.isInteger(num) || num < 0) {
        return NextResponse.json(
          { error: "Low stock threshold must be a non-negative integer." },
          { status: 400 }
        );
      }
      parsedThreshold = num;
    }

    // 3. Enforce SKU uniqueness strictly within this organization
    const existing = await prisma.product.findUnique({
      where: {
        organizationId_sku: {
          organizationId: session.organizationId,
          sku: sanitizedSku,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `SKU "${sanitizedSku}" already exists in your organization.`,
        },
        { status: 409 }
      );
    }

    // 4. Create product with derived session.organizationId
    const product = await prisma.product.create({
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
        organizationId: session.organizationId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error creating product." },
      { status: 500 }
    );
  }
}
