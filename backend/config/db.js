const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnected = false;
let useLocalFallback = false;

const DB_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

class JSONQuery {
  constructor(data, promise) {
    this._data = data;
    this._promise = promise || Promise.resolve(data);
  }

  sort(sortObj) {
    this._promise = this._promise.then(data => {
      if (!data || !Array.isArray(data)) return data;
      const sorted = [...data];
      const key = Object.keys(sortObj)[0];
      const order = sortObj[key];
      sorted.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (typeof valA === 'string') {
          return order === -1 ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        return order === -1 ? (valB - valA) : (valA - valB);
      });
      return sorted;
    });
    return this;
  }

  limit(num) {
    this._promise = this._promise.then(data => {
      if (!data || !Array.isArray(data)) return data;
      return data.slice(0, num);
    });
    return this;
  }

  populate(field) {
    // Basic mock populate (just returns current data since deep model links are handled manually or can be mocked)
    return this;
  }

  then(onFulfilled, onRejected) {
    return this._promise.then(onFulfilled, onRejected);
  }
}

class JSONModel {
  constructor(modelName, schemaDef) {
    this.modelName = modelName;
    this.filePath = path.join(DB_DIR, `${modelName.toLowerCase()}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  _match(item, query) {
    if (!query) return true;
    for (let key in query) {
      let qVal = query[key];
      let itemVal = item[key];

      if (qVal && typeof qVal === 'object' && !Array.isArray(qVal)) {
        // Handle operator fields like $gte, $lte, $in, $ne
        for (let op in qVal) {
          const opVal = qVal[op];
          if (op === '$gte' && !(itemVal >= opVal)) return false;
          if (op === '$lte' && !(itemVal <= opVal)) return false;
          if (op === '$gt' && !(itemVal > opVal)) return false;
          if (op === '$lt' && !(itemVal < opVal)) return false;
          if (op === '$ne' && itemVal === opVal) return false;
          if (op === '$in') {
            if (!Array.isArray(opVal)) return false;
            if (!opVal.includes(itemVal)) return false;
          }
          if (op === '$regex') {
            const regex = new RegExp(opVal, qVal['$options'] || '');
            if (!regex.test(itemVal)) return false;
          }
        }
      } else if (qVal instanceof RegExp) {
        if (!qVal.test(itemVal)) return false;
      } else {
        // Direct value comparison (handling MongoDB ObjectIds or Strings)
        if (qVal && itemVal && (qVal.toString() !== itemVal.toString())) {
          return false;
        }
        if (qVal !== itemVal && qVal.toString() !== itemVal.toString()) {
          return false;
        }
      }
    }
    return true;
  }

  createInstance(data) {
    const self = this;
    const item = { _id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
    return {
      ...item,
      save: async function() {
        const records = self._read();
        const index = records.findIndex(r => r._id === this._id);
        this.updatedAt = new Date().toISOString();
        if (index > -1) {
          records[index] = { ...records[index], ...this };
        } else {
          records.push(this);
        }
        self._write(records);
        return this;
      }
    };
  }

  find(query = {}) {
    const data = this._read();
    const filtered = data.filter(item => this._match(item, query));
    return new JSONQuery(filtered);
  }

  findOne(query = {}) {
    const data = this._read();
    const filtered = data.find(item => this._match(item, query)) || null;
    return new JSONQuery(filtered);
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const records = this._read();
    const items = Array.isArray(data) ? data : [data];
    const createdItems = [];

    for (let itemData of items) {
      const newItem = {
        _id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...itemData
      };
      records.push(newItem);
      createdItems.push(newItem);
    }

    this._write(records);
    return Array.isArray(data) ? createdItems : createdItems[0];
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  async findOneAndUpdate(query, update, options = {}) {
    const records = this._read();
    const index = records.findIndex(item => this._match(item, query));
    if (index === -1) {
      if (options.upsert) {
        const newRecord = { _id: generateId(), ...query, ...update, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        records.push(newRecord);
        this._write(records);
        return newRecord;
      }
      return null;
    }

    let current = records[index];
    // Check if update is a mongoose-like update (e.g. using $set or $inc or direct keys)
    let newValues = {};
    if (update.$set) {
      newValues = { ...update.$set };
    } else if (update.$inc) {
      newValues = { ...current };
      for (let k in update.$inc) {
        newValues[k] = (Number(current[k]) || 0) + Number(update.$inc[k]);
      }
    } else {
      newValues = { ...update };
    }

    const updatedRecord = {
      ...current,
      ...newValues,
      updatedAt: new Date().toISOString()
    };

    records[index] = updatedRecord;
    this._write(records);
    return updatedRecord;
  }

  async findByIdAndDelete(id) {
    return this.deleteOne({ _id: id });
  }

  async deleteOne(query) {
    const records = this._read();
    const index = records.findIndex(item => this._match(item, query));
    if (index === -1) return { deletedCount: 0 };
    const deleted = records.splice(index, 1);
    this._write(records);
    return { deletedCount: 1, deletedItem: deleted[0] };
  }

  async deleteMany(query) {
    const records = this._read();
    const remaining = records.filter(item => !this._match(item, query));
    const deletedCount = records.length - remaining.length;
    this._write(remaining);
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const data = this._read();
    return data.filter(item => this._match(item, query)).length;
  }
}

const connectDB = async () => {
  if (isConnected) return;
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.log('⚠️ No MONGO_URI in environment variables. Falling back to local JSON database storage.');
    useLocalFallback = true;
    return;
  }

  try {
    // Attempt Mongoose connection with a 3-second timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    useLocalFallback = false;
    console.log('✅ Successfully connected to MongoDB database.');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️ Falling back to local JSON database storage.');
    useLocalFallback = true;
  }
};

const getModel = (modelName, schemaDef) => {
  let mongooseModel;
  let jsonModel;

  const getTarget = () => {
    if (useLocalFallback) {
      if (!jsonModel) {
        jsonModel = new JSONModel(modelName, schemaDef);
      }
      return jsonModel;
    } else {
      if (!mongooseModel) {
        try {
          mongooseModel = mongoose.model(modelName);
        } catch (e) {
          mongooseModel = mongoose.model(modelName, new mongoose.Schema(schemaDef, { timestamps: true }));
        }
      }
      return mongooseModel;
    }
  };

  // Return a proxy that forwards everything to the dynamic target
  return new Proxy({}, {
    get(target, prop) {
      const activeModel = getTarget();
      const value = activeModel[prop];
      
      // If it's a method (like find, create, etc.), bind it to the activeModel
      if (typeof value === 'function') {
        return value.bind(activeModel);
      }
      
      return value;
    },
    construct(target, args) {
      const activeModel = getTarget();
      
      // If using Mongoose, we construct the actual Mongoose document
      if (!useLocalFallback) {
        return new activeModel(...args);
      }
      
      // If using JSON fallback, we use our createInstance method
      return activeModel.createInstance(...args);
    }
  });
};

const getFallbackStatus = () => useLocalFallback;

module.exports = {
  connectDB,
  getModel,
  getFallbackStatus,
  JSONModel
};
