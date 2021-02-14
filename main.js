const AWS = require('aws-sdk');
const stream = require('stream');

const Transform = stream.Transform;
const s3 = new AWS.S3();
const { pipeline } = require('stream');

const INPUT_FILE = 'INPUT_FILE_NAME';
const OUTPUT_FILE = 'OUTPUT_FILE_NAME';
const BUCKET_NAME = 'BUCKET_NAME';

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

let readStream = s3.getObject(readParams).createReadStream();

const { writeStream, uploadPromise } = writeToBucket();

const bufferMutator = new Transform({
    transform(chunk, encoding, callback) {
        let line = chunk.toString();
        // Do mutations to 'line' here
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
            console.error('Error with pipeline');
        } else {
            console.log('success')
        }
    }
)

//readStream.on('close', async () => {
//    console.log('Download complete');
//    writeStream.end();
//    await uploadPromise.then(data => {
//        console.log(data);
//        console.log('Upload Complete');
//    });
//});
