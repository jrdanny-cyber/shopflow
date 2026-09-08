import { useEffect, useState } from "react";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load products");
        setLoading(false);
      });
  }, []);

  function addToCart(product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function increaseQuantity(productId) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(productId) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }
  
  async function handleCheckout() {
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Checkout failed");
    }

    alert(
      `Order #${data.order.id} created successfully! Total: $${Number(
        data.order.total
      ).toFixed(2)}`
    );

    setCart([]);
  } catch (error) {
    console.error(error);

    alert(error.message);
  }
}
  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="app">
      <header className="header">
        <h1>ShopFlow</h1>

        <nav>
          <a href="#products">Products</a>
          <a href="#cart">Cart ({cartItemCount})</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <h2>Welcome to ShopFlow</h2>
          <p>
            Your modern platform for discovering and ordering products.
          </p>
        </section>

        <section className="products" id="products">
          <h2>Products</h2>

          {loading && <p>Loading products...</p>}

          {error && <p className="error">{error}</p>}

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <h3>{product.name}</h3>

                <p>{product.description}</p>

                <strong>
                  ${Number(product.price).toFixed(2)}
                </strong>

                <p>Stock: {product.stock}</p>

                <button onClick={() => addToCart(product)}>
                  Add to cart
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="cart" id="cart">
          <h2>Shopping Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>

                    <p>
                      ${Number(item.price).toFixed(2)} each
                    </p>
                  </div>

                  <div className="quantity-controls">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => increaseQuantity(item.id)}
                    >
                      +
                    </button>
                  </div>

                  <strong>
                    $
                    {(Number(item.price) * item.quantity).toFixed(2)}
                  </strong>

                  <button
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="cart-total">
                <h3>
                  Total: ${cartTotal.toFixed(2)}
                </h3>

                <button
                   className="checkout-button"
                   onClick={handleCheckout}
                   disabled={cart.length === 0}
                 >
                   Checkout
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <footer>
        <p>© 2026 ShopFlow</p>
      </footer>
    </div>
  );
}

export default App;
