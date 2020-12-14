const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const yup = require("yup");
const { nanoid } = require("nanoid");
const monk = require("monk");

// require("dotenv").config();

const db = monk(process.env.MONGODB_URL);
const urls = db.get("urls");
urls.createIndex({ url: 1, slug: 1 }, { unique: true });

const app = express();

// to set these manually check out helmet-csp @ https://www.npmjs.com/package/helmet-csp
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

// app.get('/url/:id', (req,res) => {
//     res.json({
//     //    TODO: get a short url by id
//     })
// });

app.get("/:id", async (req, res) => {
  const { id: slug } = req.params;
  try {
    const url = await urls.findOne({ slug });
    if (url) {
      res.redirect(url.url);
    } 
    res.redirect(`/?error=${slug} not found`);
  } catch (error) {
    res.redirect(`/?error=Link not found`);
  }
});

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
        url
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

    // console.log(slug); //TODO: AWAIT DB.FINDONE by URL, iF NO URL, ALSO GO.

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
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
  });
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
