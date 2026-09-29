"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItemData } from "./cart-item";

type AddCartItem = Omit<CartItemData, "quantity"> & {
  quantity?: number;
};

type PublicCartContextValue = {
  items: CartItemData[];
  cartCount: number;
  subtotal: number;
  addItem: (item: AddCartItem) => void;
  increaseItem: (productId: string) => void;
  decreaseItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const PublicCartContext =
  createContext<PublicCartContextValue | null>(null);

const STORAGE_KEY = "nova-public-cart";

export function PublicCartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as CartItemData[];

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("No se pudo recuperar el carrito:", error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch (error) {
      console.error("No se pudo guardar el carrito:", error);
    }
  }, [items, ready]);

  function addItem(item: AddCartItem) {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (existing) =>
          existing.product_id === item.product_id &&
          JSON.stringify(existing.customization_option_ids) ===
            JSON.stringify(item.customization_option_ids),
      );

      if (existingIndex === -1) {
        return [
          ...current,
          {
            ...item,
            quantity: item.quantity ?? 1,
          },
        ];
      }

      return current.map((existing, index) =>
        index === existingIndex
          ? {
              ...existing,
              quantity:
                existing.quantity + (item.quantity ?? 1),
            }
          : existing,
      );
    });
  }

  function increaseItem(productId: string) {
    setItems((current) =>
      current.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseItem(productId: string) {
    setItems((current) =>
      current
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter((item) => item.product_id !== productId),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const cartCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const optionsTotal = item.customization_options.reduce(
          (sum, option) =>
            sum + Number(option.extra_price || 0),
          0,
        );

        return (
          total +
          (Number(item.price) + optionsTotal) * item.quantity
        );
      }, 0),
    [items],
  );

  return (
    <PublicCartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        addItem,
        increaseItem,
        decreaseItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </PublicCartContext.Provider>
  );
}

export function usePublicCart() {
  const context = useContext(PublicCartContext);

  if (!context) {
    throw new Error(
      "usePublicCart debe utilizarse dentro de PublicCartProvider.",
    );
  }

  return context;
}