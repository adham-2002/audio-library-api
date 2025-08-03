class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryStringObj = { ...this.queryString };
    const excludesFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "keyword",
      "searchBy",
    ];
    excludesFields.forEach((field) => delete queryStringObj[field]);

    // Apply filtration using [gte, gt, lte, lt]
    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    // example for queryStr: {"price":{"$gte":100,"$lte":500},"rating":{"$gt":4}}
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }
  search(modelName) {
    if (this.queryString.keyword) {
      let query = {};
      const keyword = this.queryString.keyword;
      const searchBy = this.queryString.searchBy;
      switch (modelName) {
        case "Audio":
          if (
            searchBy &&
            ["title", "artist", "album", "genre"].includes(searchBy)
          ) {
            query[searchBy] = { $regex: keyword, $options: "i" };
          } else {
            query.$or = [
              { title: { $regex: keyword, $options: "i" } },
              { artist: { $regex: keyword, $options: "i" } },
              { album: { $regex: keyword, $options: "i" } },
              { genre: { $regex: keyword, $options: "i" } },
            ];
          }
          break;

        case "User":
          if (searchBy && ["username", "email"].includes(searchBy)) {
            query[searchBy] = { $regex: keyword, $options: "i" };
          } else {
            query.$or = [
              { username: { $regex: keyword, $options: "i" } },
              { email: { $regex: keyword, $options: "i" } },
            ];
          }
          break;

        default:
          query[searchBy || "username"] = { $regex: keyword, $options: "i" };
      }

      this.mongooseQuery = this.mongooseQuery.find(query);
    }

    return this;
  }

  paginate(countDocuments) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // Pagination result
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    // next page
    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.paginationResult = pagination;
    return this;
  }
}

module.exports = ApiFeatures;
