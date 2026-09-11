import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  X,
} from "lucide-react";
import "./styles.css";

const API = "https://restaurant-8y1r.onrender.com/api";
const FILES = "https://restaurant-8y1r.onrender.com";

/*
  Handles both:

  Old images:
  /uploads/image.webp

  New Cloudinary images:
  https://res.cloudinary.com/...
*/
function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return FILES + image;
}


// =========================
// MENU CARD
// =========================

function MenuCard({ item }) {
  return (
    <article className="card">
      <img
        src={getImageUrl(item.image)}
        alt={item.name}
      />

      <div className="cardBody">
        <small>{item.category.name}</small>

        <h3>{item.name}</h3>

        <div className="prices">
          {item.halfPrice != null && (
            <span>
              Half <b>₹{item.halfPrice}</b>
            </span>
          )}

          {item.fullPrice != null && (
            <span>
              Full <b>₹{item.fullPrice}</b>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}


// =========================
// PUBLIC MENU
// =========================

function Menu() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);

  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([
          axios.get(API + "/items", {
            params: {
              category,
              sort,
              search,
            },
          }),
          axios.get(API + "/categories"),
        ]);

        setItems(a.data);
        setCats(b.data);
      } catch (error) {
        console.error("Failed to load menu:", error);
      }
    })();
  }, [category, sort, search]);

  return (
    <div>
      <header className="hero">
        <div>
          <div className="brand">HALF & FULL</div>

          <h1>The Taste of Snacks....</h1>

          <p>
            Fresh momos, chowmein, fried rice, rolls & more.
          </p>
        </div>

        <div className="contact">
          <b>Call: 9625346361</b>

          <span>FREE HOME DELIVERY</span>

          <small>
            UPTO 3 KM · MINIMUM ORDER ₹500
          </small>
        </div>
      </header>

      <main className="container">

        {/* TOOLBAR */}

        <div className="toolbar">

          <div className="search">
            <Search size={18} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search food..."
            />
          </div>

          <div className="select">
            <SlidersHorizontal size={18} />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">
                Recommended
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="name">
                Name: A-Z
              </option>
            </select>
          </div>

        </div>


        {/* CATEGORY FILTERS */}

        <div className="filters">

          <button
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
          >
            All
          </button>

          {cats.map((c) => (
            <button
              key={c.id}
              className={
                category === c.name ? "active" : ""
              }
              onClick={() => setCategory(c.name)}
            >
              {c.name}
            </button>
          ))}

        </div>


        {/* MENU ITEMS */}

        <div className="grid">
          {items.map((i) => (
            <MenuCard
              key={i.id}
              item={i}
            />
          ))}
        </div>


        {!items.length && (
          <div className="empty">
            No items found.
          </div>
        )}


        <Link
          className="adminLink"
          to="/admin"
        >
          Admin
        </Link>

      </main>
    </div>
  );
}


// =========================
// LOGIN
// =========================

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();

    try {
      const r = await axios.post(
        API + "/auth/login",
        {
          username,
          password,
        }
      );

      localStorage.setItem(
        "token",
        r.data.token
      );

      nav("/admin");

    } catch (e) {
      setError(
        e.response?.data?.message ||
        "Login failed"
      );
    }
  }

  return (
    <div className="loginPage">

      <form
        className="login"
        onSubmit={submit}
      >

        <div className="logo">
          H&F
        </div>

        <h1>Admin Login</h1>

        <p>
          Manage menu, images and prices.
        </p>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button className="primary">
          Login
        </button>

        <Link to="/">
          ← Back to menu
        </Link>

      </form>

    </div>
  );
}


// =========================
// ADD / EDIT MODAL
// =========================

function Modal({
  item,
  cats,
  onClose,
  onSaved,
}) {
  const [f, setF] = useState({
    name: item?.name || "",
    description: item?.description || "",
    halfPrice: item?.halfPrice ?? "",
    fullPrice: item?.fullPrice ?? "",
    categoryId:
      item?.categoryId ||
      cats[0]?.id ||
      "",
    isAvailable:
      item?.isAvailable ?? true,
    image: null,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  function ch(e) {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = e.target;

    setF((x) => ({
      ...x,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
          ? files[0]
          : value,
    }));
  }


  async function save(e) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const body = new FormData();

    Object.entries(f).forEach(([k, v]) => {

      if (k === "image") {

        if (v) {
          body.append(k, v);
        }

      } else {

        body.append(k, v);

      }

    });


    try {

      const h = {
        headers: {
          Authorization:
            "Bearer " +
            localStorage.getItem("token"),
        },
      };


      if (item) {

        await axios.put(
          API + "/items/" + item.id,
          body,
          h
        );

      } else {

        await axios.post(
          API + "/items",
          body,
          h
        );

      }

      onSaved();

    } catch (e) {

      console.error(
        "Save item error:",
        e
      );

      setError(
        e.response?.data?.message ||
        "Save failed"
      );

    } finally {

      setSaving(false);

    }
  }


  return (
    <div className="overlay">

      <form
        className="modal"
        onSubmit={save}
      >

        <button
          type="button"
          className="close"
          onClick={onClose}
        >
          <X />
        </button>


        <h2>
          {item
            ? "Edit Item"
            : "Add Item"}
        </h2>


        <label>
          Name

          <input
            name="name"
            value={f.name}
            onChange={ch}
            required
          />
        </label>


        <label>
          Category

          <select
            name="categoryId"
            value={f.categoryId}
            onChange={ch}
          >
            {cats.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </select>
        </label>


        <div className="two">

          <label>
            Half Price

            <input
              name="halfPrice"
              type="number"
              min="0"
              value={f.halfPrice}
              onChange={ch}
            />
          </label>


          <label>
            Full Price

            <input
              name="fullPrice"
              type="number"
              min="0"
              value={f.fullPrice}
              onChange={ch}
            />
          </label>

        </div>


        <label>
          Description

          <textarea
            name="description"
            value={f.description}
            onChange={ch}
          />
        </label>


        <label>
          Food Image

          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={ch}
            required={!item}
          />
        </label>


        <label className="check">

          <input
            name="isAvailable"
            type="checkbox"
            checked={f.isAvailable}
            onChange={ch}
          />

          Show on public menu

        </label>


        {error && (
          <div className="error">
            {error}
          </div>
        )}


        <button
          className="primary"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : item
            ? "Save Changes"
            : "Add Item"}
        </button>

      </form>

    </div>
  );
}


// =========================
// ADMIN
// =========================

function Admin() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);

  const [editing, setEditing] =
    useState(null);

  const [add, setAdd] =
    useState(false);


  const auth = {
    headers: {
      Authorization:
        "Bearer " +
        localStorage.getItem("token"),
    },
  };


  async function load() {

    try {

      const [a, b] =
        await Promise.all([
          axios.get(
            API + "/items/admin/all",
            auth
          ),

          axios.get(
            API + "/categories"
          ),
        ]);

      setItems(a.data);
      setCats(b.data);

    } catch {

      localStorage.removeItem("token");

      nav("/login");

    }
  }


  useEffect(() => {

    if (
      !localStorage.getItem("token")
    ) {
      nav("/login");
    } else {
      load();
    }

  }, []);


  async function del(id) {

    if (
      confirm(
        "Delete this item permanently?"
      )
    ) {

      await axios.delete(
        API + "/items/" + id,
        auth
      );

      load();

    }
  }


  return (
    <div className="adminPage">

      <header className="adminTop">

        <div>

          <div className="brand">
            HALF & FULL
          </div>

          <h1>Menu Admin</h1>

        </div>


        <div className="adminButtons">

          <Link to="/">
            View Menu
          </Link>


          <button
            className="primary"
            onClick={() => setAdd(true)}
          >
            <Plus size={17} />
            Add Item
          </button>


          <button
            onClick={() => {
              localStorage.removeItem(
                "token"
              );

              nav("/login");
            }}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </header>


      <main className="adminContainer">

        <div className="stats">

          <div>
            <b>{items.length}</b>
            <span>Total Items</span>
          </div>

          <div>
            <b>{cats.length}</b>
            <span>Categories</span>
          </div>

        </div>


        <div className="tableWrap">

          <table>

            <thead>

              <tr>
                <th>Image</th>
                <th>Item</th>
                <th>Category</th>
                <th>Half</th>
                <th>Full</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {items.map((i) => (

                <tr key={i.id}>

                  <td>

                    <img
                      className="thumb"
                      src={getImageUrl(i.image)}
                      alt={i.name}
                    />

                  </td>


                  <td>
                    <b>{i.name}</b>
                  </td>


                  <td>
                    {i.category.name}
                  </td>


                  <td>
                    {i.halfPrice == null
                      ? "-"
                      : "₹" + i.halfPrice}
                  </td>


                  <td>
                    {i.fullPrice == null
                      ? "-"
                      : "₹" + i.fullPrice}
                  </td>


                  <td>
                    {i.isAvailable
                      ? "Available"
                      : "Hidden"}
                  </td>


                  <td className="rowActions">

                    <button
                      onClick={() =>
                        setEditing(i)
                      }
                    >
                      <Pencil size={16} />
                    </button>


                    <button
                      className="danger"
                      onClick={() =>
                        del(i.id)
                      }
                    >
                      <Trash2 size={16} />
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </main>


      {(add || editing) && (

        <Modal
          item={editing}
          cats={cats}
          onClose={() => {
            setAdd(false);
            setEditing(null);
          }}
          onSaved={() => {
            setAdd(false);
            setEditing(null);
            load();
          }}
        />

      )}

    </div>
  );
}


// =========================
// APP
// =========================

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Menu />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/admin"
        element={<Admin />}
      />

    </Routes>
  );
}


// =========================
// RENDER APP
// =========================

createRoot(
  document.getElementById("root")
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
