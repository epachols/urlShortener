const yup = require("yup");
const { nanoid } = require("nanoid");
const monk = require("monk");

const db = monk(process.env.MONGODB_URI);
const urls = db.get("urls");
urls.createIndex({ url: 1, slug: 1 }, { unique: true });

const app = require("express")();

app.use(express.json());

const schema = yup.object().shape({
  slug: yup
    .string()
    .trim()
    .matches(/[\w\-]/i),
  url: yup.string().trim().url().required(),
});

app.post("/url", async (req, res, next) => {
  let { slug, url } = req.body;
  try {
    if (!slug) {
      await schema.validate({
        url,
      });
    } else {
      await schema.validate({
        slug,
        url,
      });
    }
    if (!slug) {
      slug = nanoid(7);
    }
    slug = slug.toLowerCase();

    const newUrl = {
      url,
      slug,
    };
    const created = await urls.insert(newUrl);
    res.json(created);
  } catch (error) {
    if (error.message.startsWith("E11000")) {
      error.message = "Slug in use. 🐛";
    }
    res.json(error);
  }
});

app.get("/:id", async (req, res) => {
  const { id: slug } = req.params;
  try {
    const url = await urls.findOne({ slug });
    if (url) {
      // res.redirect(url.url); //needs to be full response for vercel
      res.statusCode = 302;
      res.setHeader("Location", url.url);
      //must send a body or vercel thinks the response is empty
      res.end("redirect with a body 🦵");
    }
    res.end(`Error: ${slug} not found. Probs not in there.`);
  } catch (error) {
    res.end(`Error: ${error}`);
  }
});

// app.use((error, req, res, next) => {
//   if (error.status) {
//     res.status(error.status);
//   } else {
//     res.status(500);
//   }
//   res.json({
//     message: error.message,
//     stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
//   });
// });

module.exports = app;
