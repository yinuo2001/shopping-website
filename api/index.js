import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";

// this is a middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: "RS256",
});

const app = express();

app.use(cors({ origin: 'https://cs-5610-assignment-03-ttteam-1.onrender.com' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Deals with Product table
// Users can see a specific product
app.get("/products/:id", async (req, res) => {
  try { 
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: {
        id: parseInt(id, 10),
      },
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// A list of all products are displayed to all users
app.get("/products", async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

// Deals with Comment table
// All users can see all comments in this website
app.get("/comments", async (req, res) => {
  const comments = await prisma.comment.findMany();
  res.json(comments);
});

// Auth0 users can add a comment
app.post("/comments", requireAuth, async (req, res) => {
  const { text, email, userName } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const comment = await prisma.comment.create({
    data: {
      userId: user.id,
      text,
      userName
    },
  });
  res.json(comment);
});

// Auth0 users can delete their own comments
app.delete("/comments/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const auth0Id = req.auth.payload.sub;

  const comment = prisma.comment.findUnique({
    where: {
      id: parseInt(id, 10),
    },
  });
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });
  if (user.id !== comment.User.userId) {
    return res.status(403).json({ error: "You can't delete this comment" });
  }

  await prisma.comment.delete({
    where: {
      id: parseInt(id, 10),
    },
  });
  res.json({ message: "Comment deleted" });
});

// Deals with User table
// Auth0 users can get their own user information
app.get("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });

  res.json(user);
});

// Auth0 users can get the products in their shopping cart
app.get("/verify-user/products", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
    include: {
      products: true,
    },
  });

  res.json(user.products);
});

// Auth0 users can remove a product from their shopping cart
app.delete("/verify-user/products/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const { id } = req.params;
  const user = await prisma.user.update({
    where: {
      auth0Id: auth0Id,
    },
    data: {
      products: {
        disconnect: {
          id: parseInt(id, 10),
        }
      }
    }
  });
  res.json(user.products);
});

// Auth0 users can remove all products from their shopping cart
app.delete("/verify-user/products", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const user = await prisma.user.update({
    where: {
      auth0Id: auth0Id,
    },
    data: {
      products: {
        set: []
      }
    }
  });
  res.json(user);
});

// Auth0 users can add a product to their shopping cart
app.put("/verify-user/products/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const { id } = req.params;
  const user = await prisma.user.update({
    where: {
      auth0Id: auth0Id,
    },
    data: {
      products: {
        connect: {
          id: parseInt(id, 10),
        }
      }
    }
  });
  res.json(user.products);
});

// Auth0 users can update their user information
app.put("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  var user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name cannot be empty" });
  }
  user = await prisma.user.update({
    where: {
      auth0Id: auth0Id,
    },
    data: {
      name: name,
    },
  });
  res.json(user);
});

// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  // we are using the audience to get the email and name from the token
  // if your audience is different you should change the key to match your audience
  // the value should match your audience according to this document: https://docs.google.com/document/d/1lYmaGZAS51aeCxfPzCwZHIk6C5mmOJJ7yHBNPJuGimU/edit#heading=h.fr3s9fjui5yn
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: email,
        auth0Id: auth0Id,
        name: name,
      },
    });

    res.json(newUser);
  }
});

const PORT = parseInt(process.env.PORT || 8000);
app.listen(PORT, () => {
 console.log(`Server running on http://localhost:${PORT} 🎉 🚀`);
});
