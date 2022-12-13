const s3Cred = require('../s3credentials.js')
const aws = require('aws-sdk')
aws.config.update(s3Cred.awsConfig);
aws.config.apiVersions = {
    sqs: '2012-11-05',
    // other service API versions
};
const sesv2 = new aws.SESV2();


const sendEmail = async (invoice, i) => {
    try {
        console.log('Sending Email', invoice)
        console.log(i)
        let sent = false
        const getNameMatch = v => {
            if (v.match(/([a-zA-Z0-9].*)@/) && v.match(/([a-zA-Z0-9].*)@/)[1]) {
                return v.match(/([a-zA-Z0-9].*)@/)[1]
            }
            return v
        }
        if (i) {
            const defaultFrom = 'admin@tycoon.systems'
            const userFrom = i.emailFrom
            let defaultTo = [
                {
                    e: i.emailTo,
                    n: getNameMatch(i.emailTo)
                }
            ]
            for (let i = 0; i < defaultTo.length; i++) {
                sent = await doSendEmail(defaultFrom, defaultTo[i], userFrom, i)
            }
        }
        return {
            sent: sent,
            invoice: i
        }
    } catch (err) {
        console.log('failed')
        return {
            sent: false,
            invoice: null
        }
    }
}

const doSendEmail = async (from, to, userFrom, invoice) => {
    return await new Promise((resolve, reject) => {
        var params = {
            Content: {
                Simple: {
                    Body: {
                        Text: {
                            Data: `Hello ${to.n},\n\nBulk Email from Tycoon Systems Corp Multimedia Division\n\nRegards,\n\nJesse A. Thompson\nChief Technical Officer\nTycoon Systems Corp.`
                        }
                    },
                    Subject: {
                        Data: `You have received an Invoice from ${userFrom}. See more details and pay at www.tycoon.systems/invoice?=${invoice._id}`
                    }
                }
            },
            Destination: {
                ToAddresses: [
                    to.e
                ]
            },
            FromEmailAddress: from,
            FromEmailAddressIdentityArn: s3Cred.tycoonjesse
        }
        sesv2.sendEmail(params, function(err, data) {
            if (err) {
                console.log(err);
                resolve(err)
            }
            console.log(data);
            resolve(data)
        });
    })
}

module.exports = {
    sendEmail
}