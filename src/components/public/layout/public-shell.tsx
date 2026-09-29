"use client";

import { useState } from "react";
import { PublicHeader } from "./public-header";
import { CartDrawer } from "../cart/cart-drawer";
import { usePublicCart } from "../cart/public-cart-provider";

export function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);

  const {
    items,
    cartCount,
    increaseItem,
    decreaseItem,
    removeItem,
  } = usePublicCart();

  return (
    <>
      <PublicHeader
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
      />

      {children}

      <CartDrawer
        open={cartOpen}
        items={items}
        onClose={() => setCartOpen(false)}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onRemove={removeItem}
      />
    </>
  );
}