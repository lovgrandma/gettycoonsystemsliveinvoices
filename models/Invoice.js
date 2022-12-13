// Schema file to determine contractual obligation to create records in database for:
// Users

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// User scema
// Schema is an object that defines the structure of any documents that will be stored in a MongoDB collection. It enables you to define types and validators for all of your data items.

const InvoiceSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4(),
        required: true
    },
    author: {
        type: String,
        required: true
    },
    data: {
        type: Array,
        required: false
    },
    status: {
        type: String,
        required: false,
    },
    history: {
        type: Array,
        required: false
    }
});


let Invoice = mongoose.model('Invoice', InvoiceSchema);
module.exports = Invoice;