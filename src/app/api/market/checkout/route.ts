import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token) as { userId: string };
    const { address, contactName, contactPhone, comment } = await req.json();

    if (!address || !contactName || !contactPhone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId: payload.userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate total
    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    // Create Order
    const order = await prisma.order.create({
      data: {
        userId: payload.userId,
        totalAmount,
        status: "PENDING",
        address,
        contactName,
        contactPhone,
        comment,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            shopId: item.product.shopId,
            quantity: item.quantity,
            price: item.product.discountPrice || item.product.price,
            status: "PENDING"
          }))
        }
      }
    });

    // Clear Cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    // Update product stock and sold count
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity }
        }
      });
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
