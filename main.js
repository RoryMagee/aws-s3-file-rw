const AWS = require('aws-sdk');
const stream = require('stream');

const Transform = stream.Transform;
const s3 = new AWS.S3();
const { pipeline } = require('stream');

const INPUT_FILE = 'INPUT_FILE_NAME';
const OUTPUT_FILE = 'OUTPUT_FILE_NAME';
const BUCKET_NAME = 'BUCKET_NAME';

const split2 = require('split2');

const writeStream = new stream.PassThrough();

let readParams = {
    Bucket: BUCKET_NAME,
    Key: INPUT_FILE
}

let writeParams = {
    Bucket: BUCKET_NAME,
    Key: OUTPUT_FILE,
    Body: writeStream
}

let readStream = s3.getObject(readParams).createReadStream();
s3.upload(writeParams).send();

const bufferMutator = new Transform({
    transform(chunk, encoding, callback) {
        let line = chunk.toString();
        this.push(`${line}\n`);
        callback();
    }
});

pipeline(
    readStream,
    split2(),
    bufferMutator,
    writeStream,
    (err) => {
        if (err) {
            console.error('Error with pipeline', err);
        } else {
            console.log('success')
        }
    }
);
