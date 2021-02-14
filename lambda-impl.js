const AWS = require('aws-sdk');
const stream = require('stream');
const { pipeline } = require('stream');
const Transform = stream.Transform;
const split = require('binary-split');

const s3 = new AWS.S3();

const INPUT_FILE = 'INPUT_FILE_NAME';
const OUTPUT_FILE = 'OUTPUT_FILE_NAME';
const BUCKET_NAME = 'BUCKET_NAME';

const writeStream = new stream.PassThrough();

const readParams = {
    Bucket: BUCKET_NAME,
    Key: INPUT_FILE
}

const writeParams = {
    Bucket: BUCKET_NAME,
    Key: OUTPUT_FILE,
    Body: writeStream
}


exports.handler = (event) => {
    
    let readStream = s3.getObject(readParams).createReadStream();
    
    const bufferMutator = new Transform({
        transform(chunk, encoding, callback) {
            let line = chunk.toString();
            callback(null, `${line}\n`);
        }
    });
    
    s3.upload(writeParams).send();
    
    pipeline(
        readStream,
        split(),
        bufferMutator,
        writeStream,
        (err) => {
            if (err) {
                console.error('Error', err);
            } else {
                console.log('Success');
            }
        });
    
};
