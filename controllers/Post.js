/* eslint-disable no-console */
const Post = require("../models/post");
const { validationResult } = require("express-validator");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("./simpleControllerFactory");
const { bulkUpdateModelValues } = require("../utils");

const { create, read, update, remove, byId, list } = controllerHelper(
  Post,
  "post",
  true
);

exports.create = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile } = req;
  const newPost = req.body;
  const name = newPost.content.name.trim() || "";

  checkExistantName(res, { name }, () => {
    req.body.updateBy = profile;
    req.body.createBy = profile;
    req.body.name = name;
    create(req, res, post =>
      res.json({ post: post.depopulate("createBy").depopulate("updateBy") })
    );
  });
};

exports.listByType = (req, res) => {
  // create query object to hold value and category value
  const query = {};
  if (req.query.type) {
    query.type = req.query.type;
  }

  // find the product based on query object with 2 properties
  // search and category
  Post.find(query, (err, posts) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({ posts });
  });
};

exports.update = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile /*post*/ } = req;
  // const newPost = req.body;
  // const name = newPost.content.name.trim() || "";
  // checkExistantName(res, { name, _id: { $ne: post._id } }, () => {
  req.body.updateBy = profile;
  req.body.id = req.body.content.id;
  update(req, res, post =>
    res.json({ post: post.depopulate("createBy").depopulate("updateBy") })
  );
  // });
};

exports.updateMany = (req, res) => {
  const { posts, content } = req.body;
  const { profile } = req;

  if (!posts || !content) {
    return res.status(400).json({ error: "invalid values" });
  }
  content.name = undefined;
  content.id = undefined;
  const update = {};
  for (let [key, value] of Object.entries(content)) {
    update[`content.${key}`] = value;
  }
  update.updateBy = profile;

  Post.updateMany(
    { _id: { $in: posts } },
    { $set: { ...update } },
    { omitUndefined: true },
    (error, raw) => {
      if (error) {
        return res.status(400).json({ error });
      } else {
        res.json({ count: raw.nModified });
      }
    }
  );
};

const checkExistantName = (res, nameFilter, next) => {
  const { name, ...otherFilter } = nameFilter;
  Post.countDocuments({ name: name.trim(), ...otherFilter }, (err, count) => {
    if (count > 0) {
      return res
        .status(400)
        .json({ error: "Il exist deja un produit du même nom" });
    } else {
      next(false);
    }
  });
};

/**
 * step Import
 */

exports.importList = async (req, res) => {
  const { postsList, duplicatedIds, duplicatedNames } = req;
  const { replaceOnSameName, replaceOnSameId } = req.body;

  const sendResult = (postUpdated, dupliName = []) => {
    Post.find({ _id: { $in: postUpdated } }).exec((err, postResult) => {
      res.json({
        posts: postResult,
        duplicatedNames: dupliName.length > 0 ? dupliName : undefined,
        duplicatedIds:
          !replaceOnSameId && duplicatedIds.length > 0
            ? duplicatedIds
            : undefined
      });
    });
  };

  const performSaveSameNamePost = results => {
    if (replaceOnSameName && duplicatedNames.length > 0) {
      saveMany(res, duplicatedNames, "name", false, duplicate => {
        sendResult([...results, ...duplicate]);
      });
    } else {
      sendResult(results, duplicatedNames);
    }
  };

  let postToSave = [...postsList];
  if (replaceOnSameId) {
    postToSave = [...postsList, ...duplicatedIds];
  }

  if (postToSave.length > 0) {
    saveMany(res, postToSave, "id", true, results =>
      performSaveSameNamePost(results)
    );
  } else {
    performSaveSameNamePost([]);
  }
};

const saveMany = (res, values, key = "id", createNew, next) => {
  bulkUpdateModelValues(Post, values, key, createNew)
    .then(async idArray => {
      !next && res.json({ idArray });
      next && next(idArray);
    })
    .catch(error => {
      res.status(400).json({ error });
    });
};

exports.formateImportList = (req, res, next) => {
  const user = req.profile;

  const { posts } = req.body;
  if (!posts || (posts && typeof posts !== "object")) {
    return res.status(400).json({ error: "invalid posts" });
  }

  let postsList = [],
    ids = [],
    names = [];

  for (let i = 0; i < posts.length; i++) {
    const item = posts[i];
    const name =
      item.content && item.content.name ? item.content.name.trim() : "";

    const id = item.id || (item.content && item.content.id) || undefined;

    postsList.push({
      ...item,
      name,
      updateBy: user,
      createBy: !item.createBy ? user : item.createBy,
      id
    });
    ids.push(id);
    names.push(name);
  }
  req.names = names;
  req.ids = ids;
  req.postsList = postsList;
  next();
};

exports.extratDuplicatedId = async (req, res, next) => {
  const { ids, postsList } = req;

  const duplicatedIds = [];

  getSamePostId(ids, sameIds => {
    for (let i = 0; i < sameIds.length; i++) {
      const sameId = sameIds[i];
      const index = postsList.find(item => item.id === sameId.id);
      duplicatedIds.push({ ...postsList.splice(index)[0], _id: sameId._id });
    }

    req.duplicatedIds = duplicatedIds;
    req.sameIds = sameIds;
    next();
  });
};

exports.extractDuplicatedName = async (req, res, next) => {
  const { names, sameIds, postsList } = req;
  const duplicatedNames = [];

  getSameName(
    names,
    sameIds.map(item => item.id),
    sameNameIds => {
      if (sameNameIds.length > 0) {
        for (let i = 0; i < sameNameIds.length; i++) {
          const sameId = sameNameIds[i];
          const index = postsList.find(item => item.id === sameId.id);
          duplicatedNames.push({
            ...postsList.splice(index)[0],
            _id: sameId._id
          });
        }
      }
      req.duplicatedNames = duplicatedNames;
      req.postsList = postsList;
      next();
    }
  );
};

const getSamePostId = (ids, next) => {
  Post.find({ id: { $in: ids } })
    .select("id")
    .exec((err, ids) => {
      next(ids);
    });
};

const getSameName = (names, excludedId = [], next) => {
  Post.find({
    name: {
      $in: names
    },
    id: { $nin: excludedId }
  })
    .select("id")
    .exec((err, ids) => {
      next(ids);
    });
};

/**
 * Step seraching
 */

exports.listSearch = async (req, res) => {
  performSearching(req, res, "full", data =>
    res.json({
      ...data
    })
  );
};

exports.pricesRangesBySearch = async (req, res) => {
  performSearching(req, res, "pricesRange", data => {
    const range = findMinMax(data.results);
    res.json({
      min: range[0],
      max: range[1],
      range
    });
  });
};

exports.listPartialSearch = async (req, res) => {
  performSearching(req, res, "partial", data =>
    res.json({
      ...data
    })
  );
};

const performSearching = (req, res, type = "full", next) => {
  const { query } = req;
  let {
    order = "asc",
    sortBy = "name",
    limit,
    offset,
    search,
    category,
    price,
    searchInFields = [],
    ...restQuery
  } = query;

  const isNormalSearching = ["pricesRange", "featured"].indexOf(type) === -1;
  limit = isNormalSearching ? limit && parseInt(query.limit) : undefined;

  let textFilter = search ? { $text: { $search: search } } : {};

  if (type === "partial") {
    textFilter = search
      ? {
          $or: searchInFields.map(field => {
            return {
              [`${field}`]: {
                $regex: search,
                $options: "i"
              }
            };
          })
        }
      : "";
  }

  const categoryFilter = category
    ? {
        "content.category": { $regex: "^" + category }
      }
    : {};

  const pricesFilter = isNormalSearching
    ? price
      ? {
          $or: [
            {
              "content.regular_price": {
                $gte: parseInt(price[0]),
                $lte: parseInt(price[1])
              }
            },
            {
              "content.sale_price": {
                $gte: parseInt(price[0]),
                $lte: parseInt(price[1])
              }
            }
          ]
        }
      : {}
    : {};

  let filter = {
    ...textFilter,
    ...categoryFilter,
    ...pricesFilter,
    ...restQuery
  };

  if (type === "featured")
    filter = {
      $or: [
        { "content.featured": true },
        { ...filter, "content.featured": true }
      ]
    };

  execSearchPaginate(
    res,
    filter,
    {
      sortBy,
      order,
      limit,
      offset,
      searchInFields,
      select:
        type === "pricesRange"
          ? "content.regular_price content.sale_price"
          : "-createBy -createdAt -updateBy -updatedAt",
      toSort: type !== "pricesRange"
    },
    data => next(data)
  );
};

const findMinMax = arr => {
  if (arr.length === 0) return [0, 0];
  let min = arr[0].content.sale_price,
    max = arr[0].content.sale_price;
  for (let i = 1, len = arr.length; i < len; i++) {
    let v = arr[i].content.sale_price;
    min = v < min ? v : min;
    max = v > max ? v : max;
  }

  return [min, max];
};

const execSearchPaginate = (
  res,
  filter,
  {
    sortBy,
    order,
    limit,
    offset,
    searchInFields,
    select = searchInFields.join(" "),
    toSort = true
  },
  next
) => {
  const myCustomLabels = {
    totalDocs: "count",
    docs: "results"
  };

  console.log({ select });
  const option = {
    select,
    projection: toSort && { score: { $meta: "textScore" } },
    sort: toSort && { score: { $meta: "textScore" }, [`${sortBy}`]: order },
    pagination: limit !== undefined,
    customLabels: myCustomLabels
  };

  if (limit) option.limit = limit;
  if (offset) option.offset = offset;

  Post.paginate(filter, option, (err, data) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    const {
      results,
      count,
      hasNextPage,
      hasPrevPage,
      prevPage,
      nextPage
    } = data;

    const m = {
      count: count,
      next: hasNextPage && `offset=${data.limit * (nextPage - 1)}`,
      previous: hasPrevPage && `offset=${data.limit * (prevPage - 1)}`,
      results
    };
    next(m);
  });
};

/**
 * other step
 */
exports.postById = byId;
exports.read = read;
exports.remove = remove;
exports.list = list;
