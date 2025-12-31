// plugins/paginatePlugin.js
module.exports = function paginatePlugin(schema) {
  schema.statics.paginate = async function(filter, options) {
    const { page = 1, limit = 10, sort = { _id: -1 } } = options;
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.countDocuments(filter)
    ]);
    
    const pages = Math.ceil(total / limit);
    
    return {
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    };
  };
};
