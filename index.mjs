import s3Cred from './s3credentials.js'
import mongoose from 'mongoose'
import Invoice from './models/Invoice.js'
import { sendEmail } from './mail/Email.js'
export const handler = async(event) => {
    let returnData = `Lambda Function Invoked!`
    let record
    let db
    const mongoOptions = {
        auth: { authdb: s3Cred.mongo.authDb },
        user: s3Cred.mongo.u,
        pass: s3Cred.mongo.p,
        dbName: s3Cred.mongo.dbName,
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
    console.log(mongoOptions, s3Cred.mongo.address)
    const connectDB = async() => {
        try {
           const connected = await mongoose.connect(s3Cred.mongo.address, mongoOptions)
                .then(() => {
                    console.log('MongoDB Connected', mongoOptions.dbName, mongoOptions.user)
                    record += `Mongo Connected ${mongoOptions.dbName} ${mongoOptions.user}|`
                })
                .catch(err => {
                    console.log(err)
                    record += `Mongo Error ${err}`
                })
            return connected
        } catch (err) {
            console.log('Failed to connect to MongoDB', err)
            return null
        }
    }
    const getInvoices = async (status = 'pending') => {
        let i = await Invoice.find({ status: status }).lean();
        return i
    }
    const updateInvoice = async (id, status = 'sent', pdf) => {
        let updateObject = {
            status: status
        }
        if (pdf) {
            updateObject.pdfUrl = pdf
        }
        console.log(updateObject)
        let i = await Invoice.findOneAndUpdate({ _id: id }, updateObject).lean()
        return i
    }
    let invoices
    const dbConnection = await connectDB()
    console.log(mongoose.connection.readyState, event)
    record += `Mongoose: ${mongoose ? mongoose : 'No mongoose'} Db: ${db ? db : 'No db'}`
    db = mongoose.connection
    db.on('error', err => {
        console.error.bind(console, 'connection error:')
        record += `Mongo Error: ${err}`
    })
    let response
    if (mongoose.connection.readyState == 1) {
        if (event.action.match(/GET:pending/)) {
            invoices = await getInvoices()
            response = {
                statusCode: 200,
                body: JSON.stringify(returnData),
                record: record,
                data: invoices
            }
        } else if (event.action.match(/UPDATE:pending/)) {
            if (event.data) {
                const promises = event.data.map(d => new Promise(async (resolve, reject) => {
                    try {
                        if (d && d.data && d.data.key && d.data.key.match(/(?<=Invoice_)([a-zA-Z0-9].*).pdf/) && d.data.key.match(/(?<=Invoice_)([a-zA-Z0-9].*).pdf/)[1]) {
                            const updated = await updateInvoice(d.data.key.match(/(?<=Invoice_)([a-zA-Z0-9].*).pdf/)[1], 'sent', d.pdf)
                            console.log(updated, d.data)
                            // let i = await Invoice.findOne({ _id: invoice }).lean();
                            // const emailSent = await sendEmail(d.data.key.match(/(?<=Invoice_)([a-zA-Z0-9].*).pdf/)[1], i)
                            // console.log(emailSent)
                            resolve({
                                updated: updated
                            })
                        }
                    } catch (err) {
                        console.log(err)
                        resolve({
                            updated: null,
                            emailStatus: null
                        })
                    }
                }))
                Promise.all(promises)
            }
        }
    }
    
    if (connectDB) {
        return response;
    } else {
        return {
            statusCode: 500,
            body: JSON.stringify('Did not connect to MongoDB bad')
        }
    }
}
