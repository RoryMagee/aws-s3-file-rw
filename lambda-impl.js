const AWS = require('aws-sdk');
const readline = require('readline');
const stream = require('stream');

const Transform = stream.Transform;
const s3 = new AWS.S3();

const INPUT_FILE = 'custom_from_1988.csv';
const OUTPUT_FILE = 'output.csv';
const BUCKET_NAME = 'rmagee-glue-athena-test';

const split2 = require('split2');

let readParams = {
    Bucket: BUCKET_NAME,
    Key: INPUT_FILE
}

function writeToBucket() {
    const writeStream = new stream.PassThrough();

    let writeParams = {
        Bucket: BUCKET_NAME,
        Key: OUTPUT_FILE,
        Body: writeStream
    }

    const uploadPromise = s3.upload(writeParams).promise();

    return { writeStream, uploadPromise }
}

exports.handler = (event) => {
    
    let readStream = s3.getObject(readParams).createReadStream();
    
    const { writeStream, uploadPromise } = writeToBucket();
    
    const bufferMutator = new Transform({
        transform(chunk, encoding, callback) {
            let line = chunk.toString();
            line = line.toUpperCase();
            this.push(`${line}\n`);
            callback();
        }
    });
    
    readStream.pipe(split2()).pipe(bufferMutator).pipe(writeStream);
    
    readStream.on('close', async () => {
        console.log('Download complete');
        writeStream.end();
        await uploadPromise.then(data => {
            console.log(data);
            console.log('Upload Complete');
        });
    });
    
};
