import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  cartItems: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
  cartTotalQuantity: 0,
  cartTotalAmount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const itemIndex = state.cartItems.findIndex(
        (item) => item._id === action.payload._id
      );

      if (itemIndex >= 0) {
        // Item already exists in the cart so we need to increment its quantity
        state.cartItems[itemIndex].cartQuantity += 1;
        // toast.info(`Increased ${action.payload.name} quantity`, {
        //   position: "top-right",
        // });
      } else {
        // The item is not in the cart yet so we can simply push it into the array
        const tempProduct = { ...action.payload, cartQuantity: 1 };
        state.cartItems.push(tempProduct);
        toast.success(`${action.payload.name} added to cart`, {
          position: "top-right",
        });
      }

      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    decreaseCart(state, action) {
      const itemIndex = state.cartItems.findIndex(
        (cartItem) => cartItem._id === action.payload._id
      );

      if (state.cartItems[itemIndex].cartQuantity > 1) {
        state.cartItems[itemIndex].cartQuantity -= 1;

        // toast.info(`${action.payload.name}'s quantity has been decreased.`, {
        //   position: "top-right",
        // });
      } else if (state.cartItems[itemIndex].cartQuantity === 1) {
        const nextCartItems = state.cartItems.filter(
          (cartItem) => cartItem._id !== action.payload._id
        );
        state.cartItems = nextCartItems;

        toast.error(`${action.payload.name} removed from cart`, {
          position: "top-right",
        });
      }
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    removeFromCart(state, action) {
      state.cartItems.map((cartItem) => {
        if (cartItem._id === action.payload._id) {
          const nextCartItems = state.cartItems.filter(
            (item) => item._id !== cartItem._id
          );

          state.cartItems = nextCartItems;

          toast.error("Product removed from cart", {
            position: "bottom-left",
          });
        }
        localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
        return state;
      });
    },
    clearCart(state, action) {
      state.cartItems = [];
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
      toast.error("Cart cleared", { position: "bottom-left" });
    },
    getTotals(state, action) {
      let { total, quantity } = state.cartItems.reduce(
        (cartTotal, cartItem) => {
          const { price, cartQuantity } = cartItem;
          const itemTotal = price * cartQuantity;

          cartTotal.total += itemTotal;
          cartTotal.quantity += cartQuantity;
          return cartTotal;
        },
        {
          total: 0,
          quantity: 0,
        }
      );
      total = parseFloat(total.toFixed(2));
      state.cartTotalQuantity = quantity;
      state.cartTotalAmount = total;
    },
  },
});

export const { addToCart, decreaseCart, removeFromCart, clearCart, getTotals } =
  cartSlice.actions;

export default cartSlice.reducer;
