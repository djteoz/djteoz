import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import CartClient from "./CartClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CartPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?redirect=/market/cart");
  }

  let payload: { userId: string };
  try {
    payload = verifyAccessToken(token) as { userId: string };
  } catch (err) {
    redirect("/login?redirect=/market/cart");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: payload.userId },
    include: {
      items: {
        include: {
          product: {
            include: { shop: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/market"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Корзина</h1>
        <span className="text-gray-500">{cart?.items.length || 0} товаров</span>
      </div>

      <CartClient initialCart={cart} />
    </div>
  );
}
